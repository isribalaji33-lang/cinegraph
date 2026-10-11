"""
Test Suite: FastAPI Endpoints & Contract Integration.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data

def test_movies_list():
    response = client.get("/api/movies")
    assert response.status_code == 200
    movies = response.json()
    assert len(movies) == 30

def test_recommendations_endpoint():
    response = client.post("/api/recommendations", json={"user_id": "u01", "limit": 5})
    assert response.status_code == 200
    recs = response.json()
    assert len(recs) <= 5
    assert "explanation" in recs[0]
    assert "score_breakdown" in recs[0]

def test_live_lab_query_execution():
    response = client.post("/api/lab/execute", json={"query_id": "lab_collab_traversal"})
    assert response.status_code == 200
    data = response.json()
    assert "execution_time_ms" in data
    assert "plan_details" in data
    assert "graph_elements" in data
    assert len(data["records"]) > 0

def test_what_if_simulation():
    # Submit live what-if simulation for user u01 on movie m15
    response = client.post("/api/recommendations/what-if", json={
        "user_id": "u01",
        "movie_id": "m15",
        "new_rating": 5.0
    })
    assert response.status_code == 200
    data = response.json()
    assert "before_recommendations" in data
    assert "after_recommendations" in data
    assert "diff_analysis" in data
