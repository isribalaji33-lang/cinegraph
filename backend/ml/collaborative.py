"""
Collaborative Filtering Engine for CineGraph.
Implements User-Based Collaborative Filtering with mean-centering and Pearson/Cosine similarity.
Accepts an optional ratings DataFrame/list to guarantee strict leakage-free evaluation.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

class CollaborativeRecommender:
    def __init__(self):
        pass

    def fetch_ratings(self, ratings_data: Optional[List[Dict]] = None) -> pd.DataFrame:
        """Fetches ratings strictly from live Neo4j, or uses injected training ratings for leakage-free eval."""
        if ratings_data is not None:
            df = pd.DataFrame(ratings_data)
            if df.empty:
                return pd.DataFrame(columns=["user_id", "movie_id", "rating_value"])
            return df[["user_id", "movie_id", "rating_value"]]

        if not is_neo4j_live():
            raise RuntimeError("Live Neo4j instance required. In-memory fallback is disabled.")

        driver = get_driver()
        with driver.session(database=settings.NEO4J_DATABASE) as session:
            records = session.run("MATCH (u:User)-[r:RATED]->(m:Movie) RETURN u.user_id AS user_id, m.movie_id AS movie_id, r.rating_value AS rating_value").data()
            return pd.DataFrame(records)

    def compute_user_similarity(self, rating_matrix: pd.DataFrame) -> pd.DataFrame:
        """Computes pairwise cosine similarity between mean-centered user vectors."""
        # Mean-center ratings per user
        user_means = rating_matrix.mean(axis=1)
        centered_matrix = rating_matrix.sub(user_means, axis=0).fillna(0)

        # Compute cosine similarity
        norm = np.linalg.norm(centered_matrix.values, axis=1, keepdims=True)
        norm[norm == 0] = 1e-9
        normalized_matrix = centered_matrix.values / norm
        similarity = np.dot(normalized_matrix, normalized_matrix.T)

        return pd.DataFrame(similarity, index=rating_matrix.index, columns=rating_matrix.index)

    def predict_ratings(self, target_user_id: str, candidate_movie_ids: List[str], ratings_df: Optional[pd.DataFrame] = None, k_neighbors: int = 5) -> Dict[str, float]:
        """
        Predicts ratings for unseen candidate movies for target user.
        Uses mean-centering: r_hat(u, i) = mean(u) + sum(sim(u, v) * (r(v, i) - mean(v))) / sum(|sim(u, v)|)
        """
        df = ratings_df if ratings_df is not None else self.fetch_ratings()
        if df.empty or target_user_id not in df["user_id"].values:
            # Cold start fallback
            return {mid: 0.0 for mid in candidate_movie_ids}

        pivot = df.pivot(index="user_id", columns="movie_id", values="rating_value")
        if target_user_id not in pivot.index:
            return {mid: 0.0 for mid in candidate_movie_ids}

        user_mean = pivot.loc[target_user_id].dropna().mean()
        sim_df = self.compute_user_similarity(pivot)
        similar_users = sim_df.loc[target_user_id].drop(index=target_user_id, errors="ignore")

        predictions = {}
        for mid in candidate_movie_ids:
            if mid not in pivot.columns:
                predictions[mid] = user_mean if not np.isnan(user_mean) else 3.0
                continue

            # Users who rated movie mid
            other_raters = pivot[mid].dropna().index.intersection(similar_users.index)
            if len(other_raters) == 0:
                predictions[mid] = user_mean if not np.isnan(user_mean) else 3.0
                continue

            # Top k similar raters
            top_sim = similar_users.loc[other_raters].nlargest(k_neighbors)
            top_sim = top_sim[top_sim > 0.01] # Positive similarity only

            if top_sim.empty:
                predictions[mid] = user_mean if not np.isnan(user_mean) else 3.0
                continue

            # Calculate weighted deviation
            weighted_diff_sum = 0.0
            sim_sum = 0.0
            for peer_id, sim in top_sim.items():
                peer_rating = pivot.loc[peer_id, mid]
                peer_mean = pivot.loc[peer_id].dropna().mean()
                weighted_diff_sum += sim * (peer_rating - peer_mean)
                sim_sum += abs(sim)

            if sim_sum > 0:
                pred = user_mean + (weighted_diff_sum / sim_sum)
                predictions[mid] = float(np.clip(pred, 1.0, 5.0))
            else:
                predictions[mid] = user_mean if not np.isnan(user_mean) else 3.0

        return predictions

    def get_similar_users(self, target_user_id: str, limit: int = 5, ratings_df: Optional[pd.DataFrame] = None) -> List[Dict]:
        """Returns top similar users with their similarity scores and common movies."""
        df = ratings_df if ratings_df is not None else self.fetch_ratings()
        if df.empty or target_user_id not in df["user_id"].values:
            return []

        pivot = df.pivot(index="user_id", columns="movie_id", values="rating_value")
        if target_user_id not in pivot.index:
            return []

        sim_df = self.compute_user_similarity(pivot)
        if target_user_id not in sim_df.index:
            return []

        sim_scores = sim_df.loc[target_user_id].drop(index=target_user_id, errors="ignore")
        top_peers = sim_scores.nlargest(limit)

        results = []
        u_ratings = df[df["user_id"] == target_user_id].set_index("movie_id")["rating_value"]
        for peer_id, score in top_peers.items():
            if score <= 0.05:
                continue
            peer_ratings = df[df["user_id"] == peer_id].set_index("movie_id")["rating_value"]
            common = u_ratings.index.intersection(peer_ratings.index)
            results.append({
                "user_id": peer_id,
                "similarity": round(float(score), 3),
                "common_movies_count": len(common)
            })
        return results
