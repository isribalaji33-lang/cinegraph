"""
Machine Learning Evaluation Router for CineGraph (Pillar 3).
Exposes leakage-free evaluation metrics, baselines, ablation analysis,
and scoring logic formulas.
"""

from fastapi import APIRouter, Query
from backend.ml.evaluation import evaluation_suite

router = APIRouter(prefix="/api/ml", tags=["ML Evaluation"])

@router.get("/evaluation")
def get_ml_evaluation(k: int = Query(5, ge=1, le=10)):
    results = evaluation_suite.run_multi_seed_evaluation(num_seeds=5, k=k)

    scoring_formula = {
        "formula": "Hybrid_Score(u, i) = w_collab * S_collab(u, i) + w_content * S_content(u, i) + w_graph * S_graph(u, i) + w_pop * S_pop(i)",
        "default_weights": {
            "collaborative": 0.40,
            "content": 0.30,
            "graph": 0.20,
            "popularity": 0.10
        },
        "normalization": "Min-Max normalization mapping raw similarity and predicted ratings into [0.0, 1.0]",
        "leakage_guarantee": "Test ratings are strictly excluded from user-item rating pivot tables and graph traversal anchor sets during evaluation."
    }

    return {
        "evaluation_metrics": results,
        "scoring_formula": scoring_formula
    }
