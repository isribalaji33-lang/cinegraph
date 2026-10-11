"""
Users API Router for CineGraph.
ALL data is sourced exclusively from live Neo4j via Cypher queries.
Provides user listing, full profile, rating history, watch history, and taste insights.
"""

from datetime import datetime, date
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

router = APIRouter(prefix="/api/users", tags=["Users"])


def calculate_age(dob_str: str) -> int:
    """Computes derived age from date of birth string YYYY-MM-DD."""
    try:
        born = datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = date.today()
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    except Exception:
        return 30


def _require_neo4j():
    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required. In-memory fallback is disabled.")
    return get_driver()


@router.get("", response_model=List[Dict[str, Any]])
def list_users():
    driver = _require_neo4j()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        recs = session.run("""
            MATCH (u:User)
            OPTIONAL MATCH (u)-[:RATED]->()
            WITH u, count(*) AS rating_count
            RETURN u.user_id AS user_id, u.username AS username,
                   u.email AS email, u.country AS country,
                   u.user_dob AS user_dob, rating_count
            ORDER BY u.user_id
        """).data()

    results = []
    for rec in recs:
        results.append({
            "user_id": rec["user_id"],
            "username": rec["username"],
            "email": rec["email"],
            "country": rec["country"],
            "user_dob": rec["user_dob"],
            "age": calculate_age(rec["user_dob"] or "1990-01-01"),
            "is_cold_start": rec["rating_count"] == 0,
        })
    return results


@router.get("/{user_id}", response_model=Dict[str, Any])
def get_user_profile(user_id: str):
    driver = _require_neo4j()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        # User base data
        u_rec = session.run("""
            MATCH (u:User {user_id: $uid})
            RETURN u.user_id AS user_id, u.username AS username,
                   u.email AS email, u.country AS country, u.user_dob AS user_dob
        """, {"uid": user_id}).single()
        if not u_rec:
            raise HTTPException(status_code=404, detail="User not found")
        u = dict(u_rec)

        # Ratings with movie info
        r_recs = session.run("""
            MATCH (u:User {user_id: $uid})-[r:RATED]->(m:Movie)
            RETURN m.movie_id AS movie_id, m.title AS title,
                   m.release_year AS release_year,
                   r.rating_value AS rating_value, r.rating_date AS rating_date
            ORDER BY r.rating_date DESC
        """, {"uid": user_id}).data()
        ratings = [
            {
                "movie_id": r["movie_id"],
                "title": r["title"],
                "rating_value": float(r["rating_value"]),
                "rating_date": r["rating_date"],
                "release_year": r["release_year"],
            }
            for r in r_recs
        ]

        # Watch history
        w_recs = session.run("""
            MATCH (u:User {user_id: $uid})-[w:WATCHED]->(m:Movie)
            RETURN m.movie_id AS movie_id, m.title AS title,
                   w.watch_date AS watch_date, w.completion_percentage AS completion_percentage
            ORDER BY w.watch_date DESC
        """, {"uid": user_id}).data()
        watches = [
            {
                "movie_id": r["movie_id"],
                "title": r["title"],
                "watch_date": r["watch_date"],
                "completion_percentage": r["completion_percentage"],
            }
            for r in w_recs
        ]

        # Watchlist
        wl_recs = session.run("""
            MATCH (u:User {user_id: $uid})-[wl:ADDED_TO_WATCHLIST]->(m:Movie)
            RETURN m.movie_id AS movie_id, m.title AS title, wl.added_date AS added_date
            ORDER BY wl.added_date DESC
        """, {"uid": user_id}).data()
        watchlist = [
            {
                "movie_id": r["movie_id"],
                "title": r["title"],
                "added_date": r["added_date"],
            }
            for r in wl_recs
        ]

        # Genre taste affinity – derived from rated movies
        genre_recs = session.run("""
            MATCH (u:User {user_id: $uid})-[:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
            RETURN g.genre_name AS genre, count(*) AS cnt
            ORDER BY cnt DESC
            LIMIT 10
        """, {"uid": user_id}).data()
        top_genres = [{"genre": r["genre"], "count": r["cnt"]} for r in genre_recs]

    return {
        "user_id": u["user_id"],
        "username": u["username"],
        "email": u["email"],
        "country": u["country"],
        "user_dob": u["user_dob"],
        "age": calculate_age(u["user_dob"] or "1990-01-01"),
        "ratings_count": len(ratings),
        "watched_count": len(watches),
        "watchlist_count": len(watchlist),
        "ratings": ratings,
        "watched": watches,
        "watchlist": watchlist,
        "top_genres": top_genres,
        "is_cold_start": len(ratings) == 0,
    }
