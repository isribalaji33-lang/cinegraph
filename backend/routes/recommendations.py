"""
Recommendations Router for CineGraph.
ALL user/movie lookups are done exclusively via live Neo4j.
Supports:
- Personalized Hybrid Recommendations with full signal breakdown
- What-If live rating simulation with before/after diff (Pillar 3)
- Compare Users side-by-side taste comparison (Pillar 3)
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from backend.schemas.models import (
    RecommendationRequest, RecommendationItem,
    WhatIfRequest, WhatIfResponse, CompareUsersResponse,
    RatingCreate,
)
from backend.ml.hybrid_engine import hybrid_engine
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings
from backend.routes.movies import submit_rating

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


def _require_neo4j():
    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required.")
    return get_driver()


def _fetch_movie(session, movie_id: str) -> dict:
    rec = session.run(
        "MATCH (m:Movie {movie_id: $mid}) RETURN properties(m) AS props",
        {"mid": movie_id}
    ).single()
    if not rec:
        raise HTTPException(status_code=404, detail="Movie not found")
    return dict(rec["props"])


def _fetch_user(session, user_id: str) -> dict:
    rec = session.run(
        "MATCH (u:User {user_id: $uid}) RETURN properties(u) AS props",
        {"uid": user_id}
    ).single()
    if not rec:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(rec["props"])


@router.post("", response_model=List[RecommendationItem])
def get_recommendations(req: RecommendationRequest):
    recs = hybrid_engine.get_recommendations(
        user_id=req.user_id,
        limit=req.limit,
        weights=req.weights,
        genre_filter=req.genre_filter,
        min_year=req.min_year,
        max_year=req.max_year,
        onboarding_genres=req.onboarding_genres,
    )
    return recs


@router.post("/what-if", response_model=WhatIfResponse)
def simulate_what_if_rating(req: WhatIfRequest):
    """
    Pillar 3 What-If Simulation:
    1. Computes recommendations BEFORE rating.
    2. Persists the rating to Neo4j.
    3. Re-computes recommendations AFTER rating.
    4. Analyzes the delta (rank movements, entries, departures).
    """
    driver = _require_neo4j()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        movie = _fetch_movie(session, req.movie_id)

    # 1. Before recommendations
    before_recs = hybrid_engine.get_recommendations(user_id=req.user_id, limit=10, weights=req.weights)

    # 2. Persist the new rating
    submit_rating(req.movie_id, RatingCreate(
        user_id=req.user_id,
        movie_id=req.movie_id,
        rating_value=req.new_rating,
    ))

    # 3. After recommendations
    after_recs = hybrid_engine.get_recommendations(user_id=req.user_id, limit=10, weights=req.weights)

    # 4. Diff Analysis
    before_map = {item["movie_id"]: idx + 1 for idx, item in enumerate(before_recs)}
    after_map = {item["movie_id"]: idx + 1 for idx, item in enumerate(after_recs)}

    rank_shifts, new_entries, dropped_entries = [], [], []

    for item in after_recs:
        mid = item["movie_id"]
        if mid in before_map:
            diff = before_map[mid] - after_map[mid]
            rank_shifts.append({"movie_id": mid, "title": item["title"],
                                 "old_rank": before_map[mid], "new_rank": after_map[mid], "shift": diff})
        else:
            new_entries.append({"movie_id": mid, "title": item["title"],
                                 "new_rank": after_map[mid], "score": item["hybrid_score"]})

    for item in before_recs:
        mid = item["movie_id"]
        if mid not in after_map:
            dropped_entries.append({"movie_id": mid, "title": item["title"], "old_rank": before_map[mid]})

    movie_title = movie.get("title", req.movie_id)
    diff_analysis = {
        "rated_movie": movie_title,
        "rating_value": req.new_rating,
        "rank_shifts": rank_shifts,
        "new_entries": new_entries,
        "dropped_entries": dropped_entries,
        "summary": (
            f"Rating '{movie_title}' as {req.new_rating}★ caused "
            f"{len(new_entries)} new movie(s) to enter the top 10 recommendations "
            f"and shifted ranks for {len(rank_shifts)} existing candidates."
        ),
    }

    return WhatIfResponse(
        user_id=req.user_id,
        rated_movie=movie,
        rating_value=req.new_rating,
        before_recommendations=before_recs,
        after_recommendations=after_recs,
        diff_analysis=diff_analysis,
    )


@router.get("/compare", response_model=CompareUsersResponse)
def compare_users(
    user1_id: str = Query("u01", description="First user ID"),
    user2_id: str = Query("u02", description="Second user ID"),
):
    """
    Pillar 3 Compare Users:
    Shows two demo users side-by-side with distinct tastes, recommendations, and divergence.
    """
    driver = _require_neo4j()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        u1 = _fetch_user(session, user1_id)
        u2 = _fetch_user(session, user2_id)

    recs1 = hybrid_engine.get_recommendations(user_id=user1_id, limit=6)
    recs2 = hybrid_engine.get_recommendations(user_id=user2_id, limit=6)

    mids1 = {r["movie_id"] for r in recs1}
    mids2 = {r["movie_id"] for r in recs2}
    overlap = list(mids1.intersection(mids2))
    union = mids1.union(mids2)
    jaccard_distance = 1.0 - (len(overlap) / len(union)) if union else 1.0

    # Resolve overlap titles from Neo4j
    overlap_titles = []
    if overlap:
        driver = _require_neo4j()
        with driver.session(database=settings.NEO4J_DATABASE) as session:
            title_recs = session.run(
                "MATCH (m:Movie) WHERE m.movie_id IN $mids RETURN m.movie_id AS mid, m.title AS title",
                {"mids": overlap}
            ).data()
            overlap_titles = [r["title"] for r in title_recs]

    u1_name = u1.get("username", user1_id)
    u2_name = u2.get("username", user2_id)

    return CompareUsersResponse(
        user1=u1,
        user2=u2,
        user1_recommendations=recs1,
        user2_recommendations=recs2,
        taste_divergence_metrics={
            "top_candidates_overlap_count": len(overlap),
            "jaccard_divergence": round(float(jaccard_distance), 3),
            "overlap_movie_titles": overlap_titles,
            "analysis": (
                f"User '{u1_name}' and User '{u2_name}' share {len(overlap)} "
                f"recommendations in their top 6 (Jaccard divergence: {round(float(jaccard_distance), 2)}), "
                f"demonstrating clean taste separation between different graph clusters."
            ),
        },
    )
