"""
Test Suite: Cypher Queries & Aggregation Correctness.
Asserts that queries execute without inflation or Cartesian explosions.
"""

from backend.db.queries import CYPHER_QUERIES, LIVE_LAB_QUERIES
from backend.routes.movies import get_movies
from backend.seed.seed_data import MOVIES

def test_queries_exist():
    required_keys = [
        "top_rated_in_genre",
        "actors_frequently_co_star",
        "user_favorite_genres",
        "similar_movies_graph",
        "similar_users",
        "recommendations_similar_users",
        "recommendations_content_graph",
        "director_best_movies",
        "rating_averages_and_counts",
        "popular_unwatched_movies",
        "movie_graph_neighborhood",
        "admin_dashboard_counts"
    ]
    for k in required_keys:
        assert k in CYPHER_QUERIES, f"Missing query: {k}"

from fastapi.testclient import TestClient
from backend.main import app

def test_no_rating_inflation():
    """Verify that multi-join traversals do not duplicate counts."""
    client = TestClient(app)
    res = client.get("/api/movies?limit=50")
    assert res.status_code == 200
    movies = res.json()
    assert len(movies) == 30
    titles = [m["title"] for m in movies]
    assert len(titles) == len(set(titles)), "Duplicate movie titles found, indicating join inflation!"
