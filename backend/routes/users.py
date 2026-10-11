"""
Users API Router for CineGraph.
Provides user listing with derived age computation, full profile, rating history,
watch history, and taste insights.
"""

from datetime import datetime, date
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from backend.seed.seed_data import USERS, MOVIES, GENRES
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

@router.get("", response_model=List[Dict[str, Any]])
def list_users():
    results = []
    for u in USERS:
        # Never return password_hash
        user_data = {
            "user_id": u["user_id"],
            "username": u["username"],
            "email": u["email"],
            "country": u["country"],
            "user_dob": u["user_dob"],
            "age": calculate_age(u["user_dob"]),
            "is_cold_start": u["user_id"] == "u15"
        }
        results.append(user_data)
    return results

@router.get("/{user_id}", response_model=Dict[str, Any])
def get_user_profile(user_id: str):
    u = next((u for u in USERS if u["user_id"] == user_id), None)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    ratings = []
    watches = []
    watchlist = []

    movie_map = {m["movie_id"]: m for m in MOVIES}
    genre_map = {g["genre_id"]: g["genre_name"] for g in GENRES}

    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required. In-memory fallback is disabled.")

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        # Ratings
        r_recs = session.run("""
            MATCH (u:User {user_id: $uid})-[r:RATED]->(m:Movie)
            RETURN m.movie_id AS mid, r.rating_value AS val, r.rating_date AS dt
            ORDER BY r.rating_date DESC
        """, {"uid": user_id}).data()
        for rec in r_recs:
            m = movie_map.get(rec["mid"], {})
            ratings.append({
                "movie_id": rec["mid"],
                "title": m.get("title", rec["mid"]),
                "rating_value": float(rec["val"]),
                "rating_date": rec["dt"],
                "release_year": m.get("release_year")
            })

        # Watches
        w_recs = session.run("""
            MATCH (u:User {user_id: $uid})-[w:WATCHED]->(m:Movie)
            RETURN m.movie_id AS mid, w.watch_date AS dt, w.completion_percentage AS pct
            ORDER BY w.watch_date DESC
        """, {"uid": user_id}).data()
        for rec in w_recs:
            m = movie_map.get(rec["mid"], {})
            watches.append({
                "movie_id": rec["mid"],
                "title": m.get("title", rec["mid"]),
                "watch_date": rec["dt"],
                "completion_percentage": rec["pct"]
            })

        # Watchlist
        wl_recs = session.run("""
            MATCH (u:User {user_id: $uid})-[wl:ADDED_TO_WATCHLIST]->(m:Movie)
            RETURN m.movie_id AS mid, wl.added_date AS dt
            ORDER BY wl.added_date DESC
        """, {"uid": user_id}).data()
        for rec in wl_recs:
            m = movie_map.get(rec["mid"], {})
            watchlist.append({
                "movie_id": rec["mid"],
                "title": m.get("title", rec["mid"]),
                "added_date": rec["dt"]
            })

    # Calculate genre taste affinity
    genre_counts = {}
    for r in ratings:
        m = movie_map.get(r["movie_id"])
        if m:
            for gid in m.get("genres", []):
                gname = genre_map.get(gid, gid)
                genre_counts[gname] = genre_counts.get(gname, 0) + 1

    top_genres = sorted([{"genre": k, "count": v} for k, v in genre_counts.items()], key=lambda x: x["count"], reverse=True)

    return {
        "user_id": u["user_id"],
        "username": u["username"],
        "email": u["email"],
        "country": u["country"],
        "user_dob": u["user_dob"],
        "age": calculate_age(u["user_dob"]),
        "ratings_count": len(ratings),
        "watched_count": len(watches),
        "watchlist_count": len(watchlist),
        "ratings": ratings,
        "watched": watches,
        "watchlist": watchlist,
        "top_genres": top_genres,
        "is_cold_start": len(ratings) == 0
    }
