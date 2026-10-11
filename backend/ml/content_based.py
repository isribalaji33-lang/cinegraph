"""
Content-Based Recommendation Engine for CineGraph.
Combines TF-IDF cosine similarity on descriptions with multi-attribute
structured similarity (genres, director, cast, language, and release-year proximity).
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.seed.seed_data import MOVIES, GENRES, DIRECTORS, ACTORS

class ContentBasedRecommender:
    def __init__(self):
        self.movies = {m["movie_id"]: m for m in MOVIES}
        self.movie_ids = list(self.movies.keys())
        self._build_similarity_matrix()

    def _build_similarity_matrix(self):
        # 1. Text Similarity via TF-IDF
        descriptions = [self.movies[mid]["description"] for mid in self.movie_ids]
        vectorizer = TfidfVectorizer(stop_words="english", max_features=500)
        tfidf_mat = vectorizer.fit_transform(descriptions)
        text_sim = cosine_similarity(tfidf_mat, tfidf_mat)

        # 2. Structured Metadata Similarity
        n = len(self.movie_ids)
        struct_sim = np.zeros((n, n))

        for i in range(n):
            m1 = self.movies[self.movie_ids[i]]
            g1 = set(m1["genres"])
            a1 = set(m1["actors"])
            d1 = m1["director"]
            l1 = m1["language"]
            y1 = m1["release_year"]

            for j in range(n):
                if i == j:
                    struct_sim[i][j] = 1.0
                    continue
                m2 = self.movies[self.movie_ids[j]]
                g2 = set(m2["genres"])
                a2 = set(m2["actors"])
                d2 = m2["director"]
                l2 = m2["language"]
                y2 = m2["release_year"]

                # Genre Jaccard
                genre_score = len(g1.intersection(g2)) / len(g1.union(g2)) if g1.union(g2) else 0.0

                # Cast Jaccard
                actor_score = len(a1.intersection(a2)) / len(a1.union(a2)) if a1.union(a2) else 0.0

                # Director Match
                director_score = 1.0 if d1 == d2 else 0.0

                # Language Match
                lang_score = 1.0 if l1 == l2 else 0.0

                # Year Proximity (decay over 40 years)
                year_diff = abs(y1 - y2)
                year_score = max(0.0, 1.0 - (year_diff / 40.0))

                # Composite structured similarity
                struct_sim[i][j] = (
                    0.35 * genre_score +
                    0.25 * director_score +
                    0.20 * actor_score +
                    0.10 * lang_score +
                    0.10 * year_score
                )

        # Combine text (40%) and structured (60%) similarity
        self.similarity_matrix = 0.40 * text_sim + 0.60 * struct_sim
        self.sim_df = pd.DataFrame(self.similarity_matrix, index=self.movie_ids, columns=self.movie_ids)

    def get_similar_movies(self, movie_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Returns top similar movies to a given movie."""
        if movie_id not in self.sim_df.index:
            return []
        scores = self.sim_df.loc[movie_id].drop(index=movie_id).nlargest(limit)
        results = []
        for mid, score in scores.items():
            m = self.movies[mid]
            results.append({
                "movie_id": mid,
                "title": m["title"],
                "release_year": m["release_year"],
                "similarity_score": round(float(score), 4)
            })
        return results

    def score_user_candidates(self, user_ratings: List[Dict], candidate_movie_ids: List[str]) -> Dict[str, float]:
        """
        Scores unseen candidate movies based on movies the user rated highly (>= 4.0).
        Anchor movies weight the candidate similarities by their rating.
        """
        if not user_ratings:
            return {mid: 0.0 for mid in candidate_movie_ids}

        # Filter anchors rated >= 4.0
        anchors = [r for r in user_ratings if r["rating_value"] >= 4.0]
        if not anchors:
            # Fallback to any rated movies
            anchors = user_ratings

        scores = {}
        for mid in candidate_movie_ids:
            if mid not in self.sim_df.index:
                scores[mid] = 0.0
                continue

            sim_sum = 0.0
            weight_sum = 0.0
            for r in anchors:
                anchor_id = r["movie_id"]
                if anchor_id in self.sim_df.index:
                    sim = self.sim_df.loc[anchor_id, mid]
                    weight = r["rating_value"]
                    sim_sum += sim * weight
                    weight_sum += weight

            scores[mid] = float(sim_sum / weight_sum) if weight_sum > 0 else 0.0

        return scores
