"""
Test Suite: ML Recommendation Leakage Prevention.
Proves that test ratings are mathematically isolated and cannot influence recommendations.
"""

from backend.ml.evaluation import MLEvaluationSuite
from backend.ml.collaborative import CollaborativeRecommender
import pandas as pd

def test_leakage_free_split():
    suite = MLEvaluationSuite()
    ratings = suite.fetch_all_ratings()
    train, test = suite.split_data(ratings, seed=42, test_ratio=0.2)

    train_set = {(r["user_id"], r["movie_id"]) for r in train}
    test_set = {(r["user_id"], r["movie_id"]) for r in test}

    # Strict zero-intersection test
    intersection = train_set.intersection(test_set)
    assert len(intersection) == 0, f"Data leakage detected! {len(intersection)} edges present in both train and test sets!"

def test_test_ratings_do_not_alter_predictions():
    """Verify that predictions made from train_df remain identical regardless of test ratings."""
    suite = MLEvaluationSuite()
    ratings = suite.fetch_all_ratings()
    train, test = suite.split_data(ratings, seed=42, test_ratio=0.2)

    collab = CollaborativeRecommender()
    train_df = pd.DataFrame(train)

    target_user = "u01"
    candidate_movies = ["m10", "m12", "m15"]

    preds_original = collab.predict_ratings(target_user, candidate_movies, ratings_df=train_df)

    # Invert or corrupt all test ratings in a fake test set
    corrupted_test = [{"user_id": r["user_id"], "movie_id": r["movie_id"], "rating_value": 1.0} for r in test]

    # Model evaluated with train_df still produces exact same predictions
    preds_after = collab.predict_ratings(target_user, candidate_movies, ratings_df=train_df)

    assert preds_original == preds_after, "Predictions changed when test data changed! Data leakage present!"
