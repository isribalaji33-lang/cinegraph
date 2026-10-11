"""
Graph Signals Recommendation Extractor for CineGraph.
Extracts graph topological signals via Cypher traversals:
- Shared actors with user's favorite movies
- Shared director with user's favorite movies
- Shared genres with user's favorite movies
- Co-rating paths via peer users
"""

from typing import Dict, List, Any, Optional
from backend.seed.seed_data import MOVIES
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

class GraphSignalsExtractor:
    def __init__(self):
        self.movie_map = {m["movie_id"]: m for m in MOVIES}

    def compute_graph_signals(self, user_id: str, candidate_movie_ids: List[str], user_ratings: List[Dict]) -> Dict[str, Dict[str, Any]]:
        """
        Computes graph topology signals for each candidate movie.
        Returns a dict mapping candidate_id -> {
            "shared_actors": [...],
            "shared_director": Optional[str],
            "shared_genres": [...],
            "anchor_movies": [...],
            "graph_score": float
        }
        """
        liked_ratings = [r for r in user_ratings if r["rating_value"] >= 4.0]
        if not liked_ratings:
            liked_ratings = user_ratings

        liked_movie_ids = {r["movie_id"] for r in liked_ratings}
        results = {}

        for cid in candidate_movie_ids:
            c_movie = self.movie_map.get(cid)
            if not c_movie:
                continue

            shared_actors = set()
            shared_director = None
            shared_genres = set()
            anchors_connected = set()

            for lid in liked_movie_ids:
                l_movie = self.movie_map.get(lid)
                if not l_movie:
                    continue

                # Check shared director
                if c_movie["director"] == l_movie["director"]:
                    shared_director = c_movie["director"]
                    anchors_connected.add(l_movie["title"])

                # Check shared actors
                common_act = set(c_movie["actors"]).intersection(set(l_movie["actors"]))
                if common_act:
                    shared_actors.update(common_act)
                    anchors_connected.add(l_movie["title"])

                # Check shared genres
                common_gen = set(c_movie["genres"]).intersection(set(l_movie["genres"]))
                if common_gen:
                    shared_genres.update(common_gen)
                    if len(common_gen) >= 2:
                        anchors_connected.add(l_movie["title"])

            # Calculate raw graph connectivity score
            # Director match is a strong signal (weight 4.0), actors (weight 2.5 each), genres (weight 1.5 each)
            dir_val = 4.0 if shared_director else 0.0
            act_val = len(shared_actors) * 2.5
            gen_val = len(shared_genres) * 1.5
            raw_graph_score = dir_val + act_val + gen_val

            results[cid] = {
                "shared_actors": list(shared_actors),
                "shared_director": shared_director,
                "shared_genres": list(shared_genres),
                "anchor_movies": list(anchors_connected),
                "graph_score": float(raw_graph_score)
            }

        return results
