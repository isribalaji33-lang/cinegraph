"""
Hybrid Recommendation Engine for CineGraph.
Fuses Collaborative Filtering, Content-Based Similarity, Graph Traversal Signals,
and Popularity into a normalized score with configurable weights and cold-start fallback.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from backend.seed.seed_data import MOVIES, GENRES, USERS, DIRECTORS
from backend.ml.collaborative import CollaborativeRecommender
from backend.ml.content_based import ContentBasedRecommender
from backend.ml.graph_signals import GraphSignalsExtractor
from backend.ml.explainer import RecommendationExplainer
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

from typing import Dict, List, Any, Optional, Tuple, Set

class HybridRecommendationEngine:
    def __init__(self):
        self.collab = CollaborativeRecommender()
        self.content = ContentBasedRecommender()
        self.graph = GraphSignalsExtractor()
        self.explainer = RecommendationExplainer()
        self.movie_map = {m["movie_id"]: m for m in MOVIES}

    def _get_user_interactions(self, user_id: str) -> Tuple[List[Dict], Set[str], Set[str]]:
        """Fetches user ratings, watched list, and watchlist strictly from live Neo4j."""
        if not is_neo4j_live():
            raise RuntimeError("Live Neo4j instance required. In-memory fallback is disabled.")

        rated_movie_ids = set()
        watched_movie_ids = set()
        user_ratings = []

        driver = get_driver()
        with driver.session(database=settings.NEO4J_DATABASE) as session:
            r_records = session.run("MATCH (u:User {user_id: $uid})-[r:RATED]->(m:Movie) RETURN m.movie_id AS mid, r.rating_value AS val, r.rating_date AS date", {"uid": user_id}).data()
            for rec in r_records:
                rated_movie_ids.add(rec["mid"])
                user_ratings.append({"user_id": user_id, "movie_id": rec["mid"], "rating_value": float(rec["val"]), "rating_date": rec["date"]})

            w_records = session.run("MATCH (u:User {user_id: $uid})-[:WATCHED]->(m:Movie) RETURN m.movie_id AS mid", {"uid": user_id}).data()
            for rec in w_records:
                watched_movie_ids.add(rec["mid"])

        return user_ratings, rated_movie_ids, watched_movie_ids

    def _get_movie_popularity_scores(self) -> Dict[str, float]:
        """Calculates normalized popularity score [0, 1] for all movies strictly from live Neo4j."""
        if not is_neo4j_live():
            raise RuntimeError("Live Neo4j instance required. In-memory fallback is disabled.")

        pop_counts = {mid: 0 for mid in self.movie_map}
        rating_sums = {mid: 0.0 for mid in self.movie_map}

        driver = get_driver()
        with driver.session(database=settings.NEO4J_DATABASE) as session:
            records = session.run("MATCH ()-[r:RATED]->(m:Movie) RETURN m.movie_id AS mid, count(r) AS cnt, avg(r.rating_value) AS avg_val").data()
            for rec in records:
                mid = rec["mid"]
                if mid in pop_counts:
                    pop_counts[mid] = rec["cnt"]
                    rating_sums[mid] = rec["avg_val"]

        scores = {}
        for mid in self.movie_map:
            cnt = pop_counts[mid]
            avg = rating_sums[mid] / cnt if cnt > 0 else 3.0
            # Wilson-score or weighted blend of count and avg rating
            composite = (cnt * 0.4) + (avg * 1.5)
            scores[mid] = composite

        # Min-max normalize
        max_val = max(scores.values()) if scores else 1.0
        min_val = min(scores.values()) if scores else 0.0
        denom = (max_val - min_val) if (max_val - min_val) > 0 else 1.0

        return {mid: float((scores[mid] - min_val) / denom) for mid in scores}

    def _normalize_dict(self, score_dict: Dict[str, float]) -> Dict[str, float]:
        """Min-max normalizes scores into [0, 1]."""
        if not score_dict:
            return {}
        vals = list(score_dict.values())
        min_v = min(vals)
        max_v = max(vals)
        diff = max_v - min_v
        if diff <= 1e-9:
            return {k: 0.5 for k in score_dict}
        return {k: float((v - min_v) / diff) for k, v in score_dict.items()}

    def get_recommendations(
        self,
        user_id: str,
        limit: int = 10,
        weights: Optional[Dict[str, float]] = None,
        genre_filter: Optional[str] = None,
        min_year: Optional[int] = None,
        max_year: Optional[int] = None,
        onboarding_genres: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Computes hybrid movie recommendations with configurable weights, filters, and explanations.
        """
        w = weights or {
            "collaborative": 0.40,
            "content": 0.30,
            "graph": 0.20,
            "popularity": 0.10
        }
        # Normalize weights so sum is 1.0
        w_sum = sum(w.values()) or 1.0
        w_collab = w.get("collaborative", 0.4) / w_sum
        w_content = w.get("content", 0.3) / w_sum
        w_graph = w.get("graph", 0.2) / w_sum
        w_pop = w.get("popularity", 0.1) / w_sum

        user_ratings, rated_mids, watched_mids = self._get_user_interactions(user_id)

        # Candidate pool: movies the user hasn't rated or watched
        excluded_ids = rated_mids.union(watched_mids)
        candidate_ids = [mid for mid in self.movie_map.keys() if mid not in excluded_ids]

        # Apply genre/year filters if requested
        if genre_filter:
            candidate_ids = [
                mid for mid in candidate_ids
                if genre_filter in self.movie_map[mid]["genres"] or any(g["genre_name"].lower() == genre_filter.lower() for g in GENRES if g["genre_id"] in self.movie_map[mid]["genres"])
            ]
        if min_year:
            candidate_ids = [mid for mid in candidate_ids if self.movie_map[mid]["release_year"] >= min_year]
        if max_year:
            candidate_ids = [mid for mid in candidate_ids if self.movie_map[mid]["release_year"] <= max_year]

        if not candidate_ids:
            return []

        # 1. Collaborative Filtering Signals
        collab_raw = self.collab.predict_ratings(user_id, candidate_ids)
        collab_norm = self._normalize_dict(collab_raw)

        # 2. Content-Based Signals
        # If cold-start and onboarding genres provided, simulate synthetic anchors
        effective_ratings = list(user_ratings)
        if not effective_ratings and onboarding_genres:
            for mid, m in self.movie_map.items():
                if any(gid in m["genres"] for gid in onboarding_genres):
                    effective_ratings.append({"user_id": user_id, "movie_id": mid, "rating_value": 4.5})

        content_raw = self.content.score_user_candidates(effective_ratings, candidate_ids)
        content_norm = self._normalize_dict(content_raw)

        # 3. Graph Topological Signals
        graph_data = self.graph.compute_graph_signals(user_id, candidate_ids, effective_ratings)
        graph_raw = {cid: graph_data[cid]["graph_score"] for cid in candidate_ids}
        graph_norm = self._normalize_dict(graph_raw)

        # 4. Popularity Baseline Signal
        pop_norm = self._get_movie_popularity_scores()

        # 5. Similar Users for Explanations
        similar_users = self.collab.get_similar_users(user_id, limit=3)

        # 6. Cold-Start Check & Weight Re-allocation
        is_cold_start = len(user_ratings) == 0
        if is_cold_start and not onboarding_genres:
            # Fall back to high popularity + content metadata
            w_collab, w_graph = 0.0, 0.10
            w_content, w_pop = 0.45, 0.45

        # 7. Combine Scores and Generate Explanations
        recommendations = []
        for mid in candidate_ids:
            m = self.movie_map[mid]
            c_score = collab_norm.get(mid, 0.0)
            cnt_score = content_norm.get(mid, 0.0)
            g_score = graph_norm.get(mid, 0.0)
            p_score = pop_norm.get(mid, 0.5)

            hybrid_score = (
                w_collab * c_score +
                w_content * cnt_score +
                w_graph * g_score +
                w_pop * p_score
            )

            score_breakdown = {
                "collaborative": round(float(c_score * w_collab), 4),
                "content": round(float(cnt_score * w_content), 4),
                "graph": round(float(g_score * w_graph), 4),
                "popularity": round(float(p_score * w_pop), 4),
                "hybrid_score": round(float(hybrid_score), 4)
            }

            # Generate structured verifiable explanation
            explanation = self.explainer.generate_explanation(
                user_id=user_id,
                movie_id=mid,
                user_ratings=user_ratings,
                graph_info=graph_data.get(mid, {}),
                similar_users=similar_users,
                score_breakdown=score_breakdown
            )

            # Map genre and director names
            genre_names = [g["genre_name"] for g in GENRES if g["genre_id"] in m["genres"]]
            director_name = next((d["director_name"] for d in DIRECTORS if d["director_id"] == m["director"]), "Unknown")

            recommendations.append({
                "movie_id": mid,
                "title": m["title"],
                "release_year": m["release_year"],
                "language": m["language"],
                "duration": m["duration"],
                "age_rating": m["age_rating"],
                "description": m["description"],
                "genres": genre_names,
                "director": director_name,
                "hybrid_score": round(float(hybrid_score), 4),
                "score_breakdown": score_breakdown,
                "explanation": explanation
            })

        # Rank by hybrid score descending
        recommendations.sort(key=lambda x: x["hybrid_score"], reverse=True)
        return recommendations[:limit]

# Type alias helper
Tuple_UserInteractions = Any

hybrid_engine = HybridRecommendationEngine()
