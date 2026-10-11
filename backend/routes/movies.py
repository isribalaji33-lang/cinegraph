"""
Movies API Router for CineGraph.
ALL data is sourced exclusively from live Neo4j via Cypher queries.
Provides discovery, search, full movie details, and interaction endpoints (ratings, watches, reviews).
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.schemas.models import (
    MovieCardResponse, MovieDetailsResponse,
    RatingCreate, RatingResponse,
    WatchCreate, WatchlistCreate, ReviewCreate,
)
from backend.ml.content_based import ContentBasedRecommender
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

router = APIRouter(prefix="/api/movies", tags=["Movies"])
content_recommender = ContentBasedRecommender()


def _require_neo4j():
    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required. In-memory fallback is disabled.")
    return get_driver()


def _get_movie_ratings(session, movie_id: str):
    """Fetches ratings for a movie from Neo4j and computes avg + distribution."""
    records = session.run(
        "MATCH ()-[r:RATED]->(m:Movie {movie_id: $mid}) RETURN r.rating_value AS val",
        {"mid": movie_id}
    ).data()
    vals = [float(rec["val"]) for rec in records]
    count = len(vals)
    avg = round(sum(vals) / count, 2) if count > 0 else 0.0
    dist = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    for v in vals:
        if v >= 4.5:   dist["5"] += 1
        elif v >= 3.5: dist["4"] += 1
        elif v >= 2.5: dist["3"] += 1
        elif v >= 1.5: dist["2"] += 1
        else:          dist["1"] += 1
    return count, avg, dist


@router.get("", response_model=List[MovieCardResponse])
def get_movies(
    q: Optional[str] = Query(None, description="Search query in title or description"),
    genre: Optional[str] = Query(None, description="Filter by genre name"),
    director: Optional[str] = Query(None, description="Filter by director name"),
    actor: Optional[str] = Query(None, description="Filter by actor name"),
    language: Optional[str] = Query(None, description="Filter by language"),
    year: Optional[int] = Query(None, description="Filter by release year"),
    limit: int = Query(30, ge=1, le=100),
):
    driver = _require_neo4j()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        # Build a flexible Cypher query with optional WHERE clauses
        cypher = """
            MATCH (m:Movie)
            OPTIONAL MATCH (m)-[:DIRECTED_BY]->(d:Director)
            OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
            OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
            WITH m, d,
                 collect(DISTINCT g.genre_name) AS genres,
                 collect(DISTINCT a.actor_name) AS actor_names
            WHERE ($q IS NULL OR toLower(m.title) CONTAINS toLower($q)
                              OR toLower(coalesce(m.description,'')) CONTAINS toLower($q)
                              OR toLower(coalesce(d.director_name,'')) CONTAINS toLower($q))
              AND ($genre IS NULL OR $genre IN genres)
              AND ($director IS NULL OR toLower(coalesce(d.director_name,'')) CONTAINS toLower($director))
              AND ($actor IS NULL OR any(an IN actor_names WHERE toLower(an) CONTAINS toLower($actor)))
              AND ($language IS NULL OR toLower(m.language) = toLower($language))
              AND ($year IS NULL OR m.release_year = $year)
            RETURN m, d.director_name AS director_name, genres
            ORDER BY m.movie_id
            LIMIT $limit
        """
        params = {
            "q": q, "genre": genre, "director": director,
            "actor": actor, "language": language, "year": year,
            "limit": limit,
        }
        movie_recs = session.run(cypher, params).data()

        results = []
        for rec in movie_recs:
            m = dict(rec["m"])
            cnt, avg, _ = _get_movie_ratings(session, m["movie_id"])
            results.append(MovieCardResponse(
                movie_id=m["movie_id"],
                title=m["title"],
                language=m.get("language", ""),
                release_year=m.get("release_year", 0),
                duration=m.get("duration"),
                age_rating=m.get("age_rating", ""),
                description=m.get("description", ""),
                director_name=rec.get("director_name") or "Unknown",
                genres=rec.get("genres") or [],
                avg_rating=avg,
                rating_count=cnt,
            ))
        return results


@router.get("/{movie_id}", response_model=MovieDetailsResponse)
def get_movie_details(movie_id: str):
    driver = _require_neo4j()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        # Core movie + director
        m_rec = session.run("""
            MATCH (m:Movie {movie_id: $mid})
            OPTIONAL MATCH (m)-[:DIRECTED_BY]->(d:Director)
            RETURN m, d
        """, {"mid": movie_id}).single()
        if not m_rec:
            raise HTTPException(status_code=404, detail="Movie not found")

        m = dict(m_rec["m"])
        d = dict(m_rec["d"]) if m_rec["d"] else {}

        # Genres
        genre_recs = session.run("""
            MATCH (m:Movie {movie_id: $mid})-[:HAS_GENRE]->(g:Genre)
            RETURN g.genre_name AS genre_name
        """, {"mid": movie_id}).data()
        genre_names = [r["genre_name"] for r in genre_recs]

        # Actors
        actor_recs = session.run("""
            MATCH (a:Actor)-[:ACTED_IN]->(m:Movie {movie_id: $mid})
            RETURN properties(a) AS actor
        """, {"mid": movie_id}).data()
        actors_objs = [r["actor"] for r in actor_recs]

        # Studios
        studio_recs = session.run("""
            MATCH (m:Movie {movie_id: $mid})-[:PRODUCED_BY]->(s:Studio)
            RETURN properties(s) AS studio
        """, {"mid": movie_id}).data()
        studios_objs = [r["studio"] for r in studio_recs]

        # Awards
        award_recs = session.run("""
            MATCH (m:Movie {movie_id: $mid})-[wa:WON_AWARD|NOMINATED_FOR]->(aw:Award)
            RETURN aw.award_id AS award_id, aw.award_name AS award_name,
                   aw.category AS category, wa.year AS year, type(wa) AS result
        """, {"mid": movie_id}).data()
        award_list = [
            {
                "award_id": r["award_id"],
                "award_name": r["award_name"],
                "category": r["category"],
                "year": r["year"],
                "result": "Won" if r["result"] == "WON_AWARD" else "Nominated",
            }
            for r in award_recs
        ]

        # Reviews
        rev_recs = session.run("""
            MATCH (u:User)-[:WROTE]->(r:Review)-[:ABOUT]->(m:Movie {movie_id: $mid})
            RETURN u.username AS username, r.review_text AS review_text, r.review_date AS review_date
            ORDER BY r.review_date DESC
            LIMIT 10
        """, {"mid": movie_id}).data()

        cnt, avg, dist = _get_movie_ratings(session, movie_id)

    sim_movies = content_recommender.get_similar_movies(movie_id, limit=6)

    return MovieDetailsResponse(
        movie_id=m["movie_id"],
        title=m["title"],
        language=m.get("language", ""),
        release_year=m.get("release_year", 0),
        duration=m.get("duration"),
        age_rating=m.get("age_rating", ""),
        description=m.get("description", ""),
        director_name=d.get("director_name") or "Unknown",
        director=d,
        genres=genre_names,
        actors=actors_objs,
        studios=studios_objs,
        awards=award_list,
        avg_rating=avg,
        rating_count=cnt,
        rating_distribution=dist,
        reviews=list(rev_recs),
        similar_movies=sim_movies,
    )


@router.post("/{movie_id}/rate", response_model=RatingResponse)
def submit_rating(movie_id: str, rating_data: RatingCreate):
    driver = _require_neo4j()
    today_str = datetime.now().strftime("%Y-%m-%d")
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        exists = session.run(
            "MATCH (m:Movie {movie_id: $mid}) RETURN m LIMIT 1", {"mid": movie_id}
        ).single()
        if not exists:
            raise HTTPException(status_code=404, detail="Movie not found")
        session.run("""
            MATCH (u:User {user_id: $uid}), (m:Movie {movie_id: $mid})
            MERGE (u)-[r:RATED]->(m)
            SET r.rating_value = $val, r.rating_date = $dt
        """, {"uid": rating_data.user_id, "mid": movie_id, "val": rating_data.rating_value, "dt": today_str})

    return RatingResponse(
        user_id=rating_data.user_id,
        movie_id=movie_id,
        rating_value=rating_data.rating_value,
        rating_date=today_str,
        message=f"Rating of {rating_data.rating_value}★ successfully persisted to Neo4j.",
    )


@router.post("/{movie_id}/watch", status_code=status.HTTP_201_CREATED)
def submit_watch(movie_id: str, watch_data: WatchCreate):
    driver = _require_neo4j()
    today_str = datetime.now().strftime("%Y-%m-%d")
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        session.run("""
            MATCH (u:User {user_id: $uid}), (m:Movie {movie_id: $mid})
            MERGE (u)-[w:WATCHED]->(m)
            SET w.watch_date = $dt, w.completion_percentage = $pct
        """, {"uid": watch_data.user_id, "mid": movie_id, "dt": today_str, "pct": watch_data.completion_percentage})
    return {"message": "Watched state recorded", "movie_id": movie_id, "completion_percentage": watch_data.completion_percentage}


@router.post("/{movie_id}/watchlist", status_code=status.HTTP_201_CREATED)
def add_to_watchlist(movie_id: str, data: WatchlistCreate):
    driver = _require_neo4j()
    today_str = datetime.now().strftime("%Y-%m-%d")
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        session.run("""
            MATCH (u:User {user_id: $uid}), (m:Movie {movie_id: $mid})
            MERGE (u)-[wl:ADDED_TO_WATCHLIST]->(m)
            SET wl.added_date = $dt
        """, {"uid": data.user_id, "mid": movie_id, "dt": today_str})
    return {"message": "Movie added to watchlist", "movie_id": movie_id}


@router.post("/{movie_id}/review", status_code=status.HTTP_201_CREATED)
def submit_review(movie_id: str, data: ReviewCreate):
    driver = _require_neo4j()
    rev_id = f"rw_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    today_str = datetime.now().strftime("%Y-%m-%d")
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        session.run("""
            MATCH (u:User {user_id: $uid}), (m:Movie {movie_id: $mid})
            CREATE (r:Review {review_id: $rid, review_text: $txt, review_date: $dt})
            CREATE (u)-[:WROTE]->(r)
            CREATE (r)-[:ABOUT]->(m)
        """, {"uid": data.user_id, "mid": movie_id, "rid": rev_id, "txt": data.review_text, "dt": today_str})
    return {"message": "Review submitted successfully", "review_id": rev_id}
