"""
Test Suite: Verifiable Explanations (Pillar 2).
Verifies that every claim in an explanation object matches the ground-truth graph database relations.
"""

from backend.ml.hybrid_engine import hybrid_engine
from backend.seed.seed_data import MOVIES, DIRECTORS, ACTORS, GENRES

def test_explanations_are_factually_verifiable():
    recs = hybrid_engine.get_recommendations(user_id="u01", limit=5)
    assert len(recs) > 0

    movie_map = {m["movie_id"]: m for m in MOVIES}
    director_map = {d["director_name"]: d["director_id"] for d in DIRECTORS}
    actor_map = {a["actor_name"]: a["actor_id"] for a in ACTORS}

    for item in recs:
        exp = item["explanation"]
        assert "sentence" in exp
        assert "score_breakdown" in exp
        assert len(exp["sentence"]) > 0

        target_movie = movie_map[item["movie_id"]]

        # 1. If shared director claimed, verify target movie actually has that director
        if exp.get("shared_director"):
            claimed_dir = exp["shared_director"]
            dir_id = director_map.get(claimed_dir)
            assert target_movie["director"] == dir_id, f"False director claim: {claimed_dir} does not direct {target_movie['title']}"

        # 2. If shared actors claimed, verify target movie actually stars them
        for actor_name in exp.get("shared_actors", []):
            actor_id = actor_map.get(actor_name)
            assert actor_id in target_movie["actors"], f"False actor claim: {actor_name} is not in cast of {target_movie['title']}"

        # 3. If top genres claimed, verify target movie belongs to them
        for g in exp.get("top_genres_matched", []):
            g_name = g["genre"]
            matched_gid = next((gen["genre_id"] for gen in GENRES if gen["genre_name"] == g_name), None)
            assert matched_gid in target_movie["genres"], f"False genre claim: {target_movie['title']} does not have genre {g_name}"
