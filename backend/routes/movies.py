"""
Movies API Router for CineGraph.
Provides discovery, search, full movie details, and interaction endpoints (ratings, watches, reviews).
"""

from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.schemas.models import MovieCardResponse, MovieDetailsResponse, RatingCreate, RatingResponse, WatchCreate, WatchlistCreate, ReviewCreate
from backend.seed.seed_data import MOVIES, GENRES, DIRECTORS, ACTORS, STUDIOS, AWARDS
from backend.ml.content_based import ContentBasedRecommender
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

router = APIRouter(prefix="/api/movies", tags=["Movies"])
content_recommender = ContentBasedRecommender()

def _get_movie_ratings(movie_id: str):
    """Fetches ratings for a movie and computes avg_rating and distribution strictly from live Neo4j."""
    vals = []
    if not is_neo4j_live():
        raise RuntimeError("Live Neo4j instance required. In-memory fallback is disabled.")

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        records = session.run("MATCH ()-[r:RATED]->(m:Movie {movie_id: $mid}) RETURN r.rating_value AS val", {"mid": movie_id}).data()
        vals = [float(rec["val"]) for rec in records]

    count = len(vals)
    avg = round(sum(vals) / count, 2) if count > 0 else 0.0
    dist = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    for v in vals:
        if v >= 4.5: dist["5"] += 1
        elif v >= 3.5: dist["4"] += 1
        elif v >= 2.5: dist["3"] += 1
        elif v >= 1.5: dist["2"] += 1
        else: dist["1"] += 1

    return count, avg, dist

@router.get("", response_model=List[MovieCardResponse])
def get_movies(
    q: Optional[str] = Query(None, description="Search query in title or description"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    director: Optional[str] = Query(None, description="Filter by director id or name"),
    actor: Optional[str] = Query(None, description="Filter by actor id or name"),
    language: Optional[str] = Query(None, description="Filter by language"),
    year: Optional[int] = Query(None, description="Filter by release year"),
    limit: int = Query(30, ge=1, le=50)
):
    results = []
    for m in MOVIES:
        if q:
            match_str = f"{m['title']} {m['description']}".lower()
            if q.lower() not in match_str:
                continue

        if genre:
            genre_match = False
            for gid in m["genres"]:
                gname = next((g["genre_name"] for g in GENRES if g["genre_id"] == gid), "")
                if genre.lower() in [gid.lower(), gname.lower()]:
                    genre_match = True
                    break
            if not genre_match:
                continue

        if director and director not in [m["director"], next((d["director_name"] for d in DIRECTORS if d["director_id"] == m["director"]), "")]:
            continue

        if actor and not any(actor in [aid, next((a["actor_name"] for a in ACTORS if a["actor_id"] == aid), "")] for aid in m["actors"]):
            continue

        if language and language.lower() != m["language"].lower():
            continue

        if year and year != m["release_year"]:
            continue

        cnt, avg, _ = _get_movie_ratings(m["movie_id"])
        genre_names = [g["genre_name"] for g in GENRES if g["genre_id"] in m["genres"]]
        dir_name = next((d["director_name"] for d in DIRECTORS if d["director_id"] == m["director"]), "Unknown")

        results.append(MovieCardResponse(
            movie_id=m["movie_id"],
            title=m["title"],
            language=m["language"],
            release_year=m["release_year"],
            duration=m["duration"],
            age_rating=m["age_rating"],
            description=m["description"],
            director_name=dir_name,
            genres=genre_names,
            avg_rating=avg,
            rating_count=cnt
        ))

        if len(results) >= limit:
            break

    return results

@router.get("/{movie_id}", response_model=MovieDetailsResponse)
def get_movie_details(movie_id: str):
    m = next((m for m in MOVIES if m["movie_id"] == movie_id), None)
    if not m:
        raise HTTPException(status_code=404, detail="Movie not found")

    cnt, avg, dist = _get_movie_ratings(movie_id)
    genre_names = [g["genre_name"] for g in GENRES if g["genre_id"] in m["genres"]]
    dir_obj = next((d for d in DIRECTORS if d["director_id"] == m["director"]), {"director_name": "Unknown"})
    actors_objs = [a for a in ACTORS if a["actor_id"] in m["actors"]]
    studios_objs = [s for s in STUDIOS if s["studio_id"] in m["studios"]]

    # Awards
    award_list = []
    for aw_id, yr, res in m.get("awards", []):
        aw = next((a for a in AWARDS if a["award_id"] == aw_id), None)
        if aw:
            award_list.append({"award_id": aw_id, "award_name": aw["award_name"], "category": aw["category"], "year": yr, "result": res})

    # Reviews
    reviews_list = []
    if is_neo4j_live():
        driver = get_driver()
        with driver.session(database=settings.NEO4J_DATABASE) as session:
            rev_records = session.run("""
                MATCH (u:User)-[:WROTE]->(r:Review)-[:ABOUT]->(m:Movie {movie_id: $mid})
                RETURN u.username AS username, r.review_text AS review_text, r.review_date AS review_date
            """, {"mid": movie_id}).data()
            reviews_list = rev_records
    else:
        for r in mock_db.get_incoming(movie_id, "ABOUT"):
            rev_node = r.start_node
            writer_rel = mock_db.get_incoming(rev_node.id, "WROTE")
            uname = writer_rel[0].start_node.get("username", "Anonymous") if writer_rel else "Anonymous"
            reviews_list.append({
                "username": uname,
                "review_text": rev_node.get("review_text"),
                "review_date": rev_node.get("review_date")
            })

    # Similar movies
    sim_movies = content_recommender.get_similar_movies(movie_id, limit=6)

    return MovieDetailsResponse(
        movie_id=m["movie_id"],
        title=m["title"],
        language=m["language"],
        release_year=m["release_year"],
        duration=m["duration"],
        age_rating=m["age_rating"],
        description=m["description"],
        director_name=dir_obj.get("director_name"),
        director=dir_obj,
        genres=genre_names,
        actors=actors_objs,
        studios=studios_objs,
        awards=award_list,
        avg_rating=avg,
        rating_count=cnt,
        rating_distribution=dist,
        reviews=reviews_list,
        similar_movies=sim_movies
    )

@router.post("/{movie_id}/rate", response_model=RatingResponse)
def submit_rating(movie_id: str, rating_data: RatingCreate):
    m = next((m for m in MOVIES if m["movie_id"] == movie_id), None)
    if not m:
        raise HTTPException(status_code=404, detail="Movie not found")

    today_str = datetime.now().strftime("%Y-%m-%d")

    # Persist via MERGE in live Neo4j exclusively
    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required. In-memory fallback is disabled.")

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
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
        message=f"Rating of {rating_data.rating_value}★ successfully persisted to Neo4j."
    )

@router.post("/{movie_id}/watch", status_code=status.HTTP_201_CREATED)
def submit_watch(movie_id: str, watch_data: WatchCreate):
    today_str = datetime.now().strftime("%Y-%m-%d")
    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required. In-memory fallback is disabled.")

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        session.run("""
            MATCH (u:User {user_id: $uid}), (m:Movie {movie_id: $mid})
            MERGE (u)-[w:WATCHED]->(m)
            SET w.watch_date = $dt, w.completion_percentage = $pct
        """, {"uid": watch_data.user_id, "mid": movie_id, "dt": today_str, "pct": watch_data.completion_percentage})
    return {"message": "Watched state recorded", "movie_id": movie_id, "completion_percentage": watch_data.completion_percentage}

@router.post("/{movie_id}/watchlist", status_code=status.HTTP_201_CREATED)
def add_to_watchlist(movie_id: str, data: WatchlistCreate):
    today_str = datetime.now().strftime("%Y-%m-%d")
    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required. In-memory fallback is disabled.")

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        session.run("""
            MATCH (u:User {user_id: $uid}), (m:Movie {movie_id: $mid})
            MERGE (u)-[wl:ADDED_TO_WATCHLIST]->(m)
            SET wl.added_date = $dt
        """, {"uid": data.user_id, "mid": movie_id, "dt": today_str})
    return {"message": "Movie added to watchlist", "movie_id": movie_id}

@router.post("/{movie_id}/review", status_code=status.HTTP_201_CREATED)
def submit_review(movie_id: str, data: ReviewCreate):
    rev_id = f"rw_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Cardinality: exact 1 WROTE and 1 ABOUT
    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required. In-memory fallback is disabled.")

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        session.run("""
            MATCH (u:User {user_id: $uid}), (m:Movie {movie_id: $mid})
            CREATE (r:Review {review_id: $rid, review_text: $txt, review_date: $dt})
            CREATE (u)-[:WROTE]->(r)
            CREATE (r)-[:ABOUT]->(m)
        """, {"uid": data.user_id, "mid": movie_id, "rid": rev_id, "txt": data.review_text, "dt": today_str})

    return {"message": "Review submitted successfully", "review_id": rev_id}
