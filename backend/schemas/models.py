"""
Pydantic Request & Response Schemas for CineGraph API.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# User Schemas
class UserBase(BaseModel):
    user_id: str
    username: str
    email: str
    country: str
    user_dob: str
    age: Optional[int] = None

class UserResponse(UserBase):
    pass

# Movie Schemas
class MovieBase(BaseModel):
    movie_id: str
    title: str
    language: str
    release_year: int
    duration: int
    age_rating: str
    description: str

class MovieCardResponse(MovieBase):
    director_name: Optional[str] = None
    genres: List[str] = []
    avg_rating: float = 0.0
    rating_count: int = 0

class MovieDetailsResponse(MovieCardResponse):
    director: Dict[str, Any]
    actors: List[Dict[str, Any]]
    studios: List[Dict[str, Any]]
    awards: List[Dict[str, Any]]
    rating_distribution: Dict[str, int]
    reviews: List[Dict[str, Any]]
    similar_movies: List[Dict[str, Any]]

# Interaction Schemas
class RatingCreate(BaseModel):
    user_id: str
    movie_id: str
    rating_value: float = Field(..., ge=1.0, le=5.0)

class RatingResponse(BaseModel):
    user_id: str
    movie_id: str
    rating_value: float
    rating_date: str
    message: str

class WatchCreate(BaseModel):
    user_id: str
    movie_id: str
    completion_percentage: int = Field(100, ge=1, le=100)

class WatchlistCreate(BaseModel):
    user_id: str
    movie_id: str

class ReviewCreate(BaseModel):
    user_id: str
    movie_id: str
    review_text: str

# Recommendation Schemas
class RecommendationRequest(BaseModel):
    user_id: str
    limit: int = Field(10, ge=1, le=30)
    weights: Optional[Dict[str, float]] = None
    genre_filter: Optional[str] = None
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    onboarding_genres: Optional[List[str]] = None

class ScoreBreakdown(BaseModel):
    collaborative: float
    content: float
    graph: float
    popularity: float
    hybrid_score: float

class RecommendationItem(BaseModel):
    movie_id: str
    title: str
    release_year: int
    language: str
    duration: int
    age_rating: str
    description: str
    genres: List[str]
    director: str
    hybrid_score: float
    score_breakdown: ScoreBreakdown
    explanation: Dict[str, Any]

# Live Lab Schemas (Pillar 1)
class LiveLabQueryRequest(BaseModel):
    query_id: Optional[str] = None
    cypher: Optional[str] = None
    params: Optional[Dict[str, Any]] = None

class LiveLabQueryResponse(BaseModel):
    cypher: str
    params: Dict[str, Any]
    columns: List[str]
    records: List[Dict[str, Any]]
    row_count: int
    execution_time_ms: float
    plan_details: Dict[str, Any]
    graph_elements: Dict[str, List[Dict[str, Any]]] # Cytoscape nodes and edges
    traversal_walkthrough: Optional[List[Dict[str, Any]]] = None

# What-If Simulation Schemas (Pillar 3)
class WhatIfRequest(BaseModel):
    user_id: str
    movie_id: str
    new_rating: float = Field(..., ge=1.0, le=5.0)
    weights: Optional[Dict[str, float]] = None

class WhatIfResponse(BaseModel):
    user_id: str
    rated_movie: Dict[str, Any]
    rating_value: float
    before_recommendations: List[Dict[str, Any]]
    after_recommendations: List[Dict[str, Any]]
    diff_analysis: Dict[str, Any]

# Compare Users Schemas (Pillar 3)
class CompareUsersResponse(BaseModel):
    user1: Dict[str, Any]
    user2: Dict[str, Any]
    user1_recommendations: List[RecommendationItem]
    user2_recommendations: List[RecommendationItem]
    taste_divergence_metrics: Dict[str, Any]
