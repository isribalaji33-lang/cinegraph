"""
Recommendations Router for CineGraph.
Supports:
- Personalized Hybrid Recommendations with full signal breakdown
- What-If live rating simulation with before/after diff (Pillar 3)
- Compare Users side-by-side taste comparison (Pillar 3)
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from backend.schemas.models import (
    RecommendationRequest, RecommendationItem,
    WhatIfRequest, WhatIfResponse, CompareUsersResponse
)
from backend.ml.hybrid_engine import hybrid_engine
from backend.seed.seed_data import USERS, MOVIES
from backend.routes.movies import submit_rating, RatingCreate

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.post("", response_model=List[RecommendationItem])
def get_recommendations(req: RecommendationRequest):
    recs = hybrid_engine.get_recommendations(
        user_id=req.user_id,
        limit=req.limit,
        weights=req.weights,
        genre_filter=req.genre_filter,
        min_year=req.min_year,
        max_year=req.max_year,
        onboarding_genres=req.onboarding_genres
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
    movie = next((m for m in MOVIES if m["movie_id"] == req.movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    # 1. Before recommendations
    before_recs = hybrid_engine.get_recommendations(
        user_id=req.user_id,
        limit=10,
        weights=req.weights
    )

    # 2. Persist the new rating
    submit_rating(req.movie_id, RatingCreate(
        user_id=req.user_id,
        movie_id=req.movie_id,
        rating_value=req.new_rating
    ))

    # 3. After recommendations
    after_recs = hybrid_engine.get_recommendations(
        user_id=req.user_id,
        limit=10,
        weights=req.weights
    )

    # 4. Diff Analysis
    before_map = {item["movie_id"]: idx + 1 for idx, item in enumerate(before_recs)}
    after_map = {item["movie_id"]: idx + 1 for idx, item in enumerate(after_recs)}

    rank_shifts = []
    new_entries = []
    dropped_entries = []

    for item in after_recs:
        mid = item["movie_id"]
        if mid in before_map:
            old_rank = before_map[mid]
            new_rank = after_map[mid]
            diff = old_rank - new_rank # positive = moved up
            rank_shifts.append({
                "movie_id": mid,
                "title": item["title"],
                "old_rank": old_rank,
                "new_rank": new_rank,
                "shift": diff
            })
        else:
            new_entries.append({
                "movie_id": mid,
                "title": item["title"],
                "new_rank": after_map[mid],
                "score": item["hybrid_score"]
            })

    for item in before_recs:
        mid = item["movie_id"]
        if mid not in after_map:
            dropped_entries.append({
                "movie_id": mid,
                "title": item["title"],
                "old_rank": before_map[mid]
            })

    diff_analysis = {
        "rated_movie": movie["title"],
        "rating_value": req.new_rating,
        "rank_shifts": rank_shifts,
        "new_entries": new_entries,
        "dropped_entries": dropped_entries,
        "summary": f"Rating '{movie['title']}' as {req.new_rating}★ caused {len(new_entries)} new movie(s) to enter the top 10 recommendations and shifted ranks for {len(rank_shifts)} existing candidates."
    }

    return WhatIfResponse(
        user_id=req.user_id,
        rated_movie=movie,
        rating_value=req.new_rating,
        before_recommendations=before_recs,
        after_recommendations=after_recs,
        diff_analysis=diff_analysis
    )

@router.get("/compare", response_model=CompareUsersResponse)
def compare_users(
    user1_id: str = Query("u01", description="First user ID (e.g. u01 Alex Vance - Sci-Fi)"),
    user2_id: str = Query("u02", description="Second user ID (e.g. u02 Elena Rostova - Romance/Drama)")
):
    """
    Pillar 3 Compare Users:
    Shows two demo users side-by-side with distinct tastes, recommendations, and divergence.
    """
    u1 = next((u for u in USERS if u["user_id"] == user1_id), None)
    u2 = next((u for u in USERS if u["user_id"] == user2_id), None)
    if not u1 or not u2:
        raise HTTPException(status_code=404, detail="User not found")

    recs1 = hybrid_engine.get_recommendations(user_id=user1_id, limit=6)
    recs2 = hybrid_engine.get_recommendations(user_id=user2_id, limit=6)

    mids1 = set(r["movie_id"] for r in recs1)
    mids2 = set(r["movie_id"] for r in recs2)

    overlap = list(mids1.intersection(mids2))
    jaccard_distance = 1.0 - (len(overlap) / len(mids1.union(mids2))) if mids1.union(mids2) else 1.0

    return CompareUsersResponse(
        user1=u1,
        user2=u2,
        user1_recommendations=recs1,
        user2_recommendations=recs2,
        taste_divergence_metrics={
            "top_candidates_overlap_count": len(overlap),
            "jaccard_divergence": round(float(jaccard_distance), 3),
            "overlap_movie_titles": [next((m["title"] for m in MOVIES if m["movie_id"] == mid), mid) for mid in overlap],
            "analysis": f"User '{u1['username']}' and User '{u2['username']}' share {len(overlap)} recommendations in their top 6 (Jaccard divergence: {round(float(jaccard_distance), 2)}), demonstrating clean taste separation between different graph clusters."
        }
    )
