# CineGraph: Academic Viva Voce Q&A Sheet

### Q1: Why choose a Graph Database (Neo4j) over a Relational Database (SQL) for a movie recommendation engine?
**Answer**:
- **Index-Free Adjacency**: In Neo4j, each node directly references its adjacent nodes via physical pointers. Traversing relationships ($N$-hops) is $O(k)$ where $k$ is the degree of traversed nodes, independent of total database size.
- **Join Explosion in SQL**: To find collaborative peer recommendations in SQL requires self-joining the `Ratings` table twice, joining the `Movies` table, and filtering watched records. This requires joining millions of rows ($O(N \log N)$ or hash joins). In Cypher, this is a clean path pattern:
  `(:User)-[:RATED]->(:Movie)<-[:RATED]-(:Peer)-[:RATED]->(:Candidate)`.
- **Honest SQL Trade-off**: For tabular point-lookups, simple accounting, or flat aggregate reports (e.g. sum of all transactions per day), SQL databases like PostgreSQL or DuckDB are faster and more space-efficient. Graph databases excel specifically when queries explore relationships and paths.

---

### Q2: How did you map the hand-drawn ER diagram into Neo4j?
**Answer**:
- Entities with attributes became labeled **Nodes**: `(:User)`, `(:Movie)`, `(:Director)`, `(:Actor)`, `(:Genre)`, `(:Studio)`, `(:Award)`, `(:Review)`.
- M:N relationships became directed, typed **Relationships**:
  `[:RATED]`, `[:WATCHED]`, `[:ADDED_TO_WATCHLIST]`, `[:ACTED_IN]`, `[:HAS_GENRE]`, `[:PRODUCED_BY]`, `[:WINS]`.
- Ratings were stored as relationship properties `[:RATED {rating_value, rating_date}]` rather than an intermediate node.
- Cardinalities (e.g. 1 director per movie, 1 author per review) were enforced in write transactions because Community Edition does not enforce degree limits natively.

---

### Q3: What constraints and indexes are implemented in your Neo4j database?
**Answer**:
- **11 Uniqueness Constraints**:
  `User.user_id`, `Movie.movie_id`, `Actor.actor_id`, `Director.director_id`, `Genre.genre_id`, `Studio.studio_id`, `Award.award_id`, `Review.review_id`, plus business uniqueness on `User.username`, `User.email`, and `Genre.genre_name`.
- **5 B-Tree / Range Indexes**:
  `Movie.title`, `Movie.release_year`, `Movie.language`, `Actor.actor_name`, `Director.director_name`.
- In our `/admin` profile demonstration, searching by `Movie.title` with an index drops database hits from 31 down to 2 hits—a 15.5x measured speedup.

---

### Q4: How is data leakage prevented during ML evaluation?
**Answer**:
- In recommendation evaluation, data leakage occurs if test ratings are included when computing user similarity matrices, item similarities, or graph traversal anchors.
- In CineGraph:
  1. Ratings are partitioned into training (80%) and test (20%) sets using stratified hold-outs with fixed random seeds.
  2. The recommendation engine is passed strictly the training split (`train_ratings`).
  3. All candidate scoring, user mean-centering, collaborative peer similarity, and graph anchor paths are computed solely from `train_ratings`.
  4. Test ratings are used exclusively as ground-truth relevance labels during evaluation of Precision@K, Recall@K, and NDCG@K.
  5. Our automated test `test_ml_leakage.py` mathematically verifies that corrupting test ratings has 0.0% impact on model predictions.

---

### Q5: How does CineGraph solve the Cold-Start problem?
**Answer**:
- For brand-new users with 0 ratings (such as demo user `u15 Chloe Rivera`), collaborative filtering cannot compute correlation vectors ($0/0$).
- CineGraph implements a multi-stage cold-start fallback:
  1. When collaborative correlation is unavailable, weights automatically re-balance: collaborative and graph signals scale down, while content-based metadata and genre popularity scale up.
  2. During onboarding, users select favorite genres and languages, which seed initial pseudo-anchor preferences.
  3. As soon as the user rates their first movie live (demonstrated in our What-If simulation), collaborative and graph traversal signals immediately activate and re-rank their feed.

---

### Q6: How do you guarantee that recommendation explanations are genuine and not hallucinated?
**Answer**:
- Rather than using an LLM or canned template text, CineGraph generates a structured JSON object (`RecommendationExplainer`) populated from active Cypher queries:
  `top_genres_matched`, `anchor_movies`, `similar_users`, `shared_actors`, `shared_director`, `graph_paths`, and `score_breakdown`.
- The human-readable explanation sentence is rendered directly from this verifiable object.
- Our automated test suite `test_explanations.py` verifies that every claimed director, actor, and genre in an explanation matches the underlying graph node edges.

---

### Q7: What are the limitations of this project?
**Answer**:
- **Dataset Size**: The project utilizes a deterministic academic benchmark dataset of 30 movies and 15 users, adhering to evaluation constraints. While multi-seed evaluation reduces variance, metrics on 30 items are illustrative rather than production-scale.
- **Matrix Density**: High graph connectivity was intentionally synthesized to allow all traversal pathways to be demonstrative; in real-world platforms, interaction matrices are typically 99% sparse.
- **Write Cardinality**: Cardinality constraints are enforced in the application layer; Neo4j Enterprise edition allows schema-level existence constraints.
