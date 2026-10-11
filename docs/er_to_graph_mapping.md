# ER Diagram to Neo4j Graph Model Mapping & Schema Decisions

## 1. Overview
The CineGraph data model is derived from the academic hand-drawn Entity-Relationship (ER) diagram, mapping relational concepts into labeled nodes, typed relationships, and properties.

---

## 2. Entities to Nodes Mapping

| ER Entity | Neo4j Node Label | Primary Key Constraint | Other Stored Attributes | Derived Attributes (Calculated, Not Stored) |
|---|---|---|---|---|
| **USER** | `:User` | `user_id` (Unique) | `username` (Unique), `email` (Unique), `password_hash`, `country`, `user_dob` | **`age`** (Calculated dynamically: `current_year - dob_year`) |
| **MOVIE** | `:Movie` | `movie_id` (Unique) | `title`, `language`, `description`, `release_year`, `duration`, `age_rating` | **`avg_rating`** (Aggregated dynamically: `avg(r.rating_value)`) |
| **ACTOR** | `:Actor` | `actor_id` (Unique) | `actor_name`, `actor_dob`, `actor_nationality` | None |
| **DIRECTOR** | `:Director` | `director_id` (Unique) | `director_name`, `director_dob`, `nationality` | None |
| **GENRE** | `:Genre` | `genre_id` (Unique) | `genre_name` (Unique) | None |
| **STUDIO** | `:Studio` | `studio_id` (Unique) | `studio_name`, `country`, `founded_year` | None |
| **AWARD** | `:Award` | `award_id` (Unique) | `award_name`, `category` | None |
| **REVIEW** | `:Review` | `review_id` (Unique) | `review_text`, `review_date` | None |

---

## 3. Relationships & Cardinalities Mapping

| ER Relationship | Cardinality | Neo4j Relationship Type | Direction | Relationship Properties |
|---|---|---|---|---|
| USER **RATES** MOVIE | M:N | `[:RATED]` | `(:User)-[:RATED]->(:Movie)` | `rating_value` (Float, 1.0–5.0), `rating_date` (ISO Date) |
| USER **WATCHES** MOVIE | M:N | `[:WATCHED]` | `(:User)-[:WATCHED]->(:Movie)` | `watch_date` (ISO Date), `completion_percentage` (Integer, 1–100) |
| USER **ADDS_TO_WATCHLIST** MOVIE | M:N | `[:ADDED_TO_WATCHLIST]` | `(:User)-[:ADDED_TO_WATCHLIST]->(:Movie)` | `added_date` (ISO Date) |
| USER **WRITES** REVIEW | 1:N | `[:WROTE]` | `(:User)-[:WROTE]->(:Review)` | None |
| REVIEW **ABOUT** MOVIE | N:1 | `[:ABOUT]` | `(:Review)-[:ABOUT]->(:Movie)` | None |
| ACTOR **ACTED_IN** MOVIE | M:N | `[:ACTED_IN]` | `(:Actor)-[:ACTED_IN]->(:Movie)` | None |
| MOVIE **DIRECTED_BY** DIRECTOR | N:1 | `[:DIRECTED_BY]` | `(:Movie)-[:DIRECTED_BY]->(:Director)` | None (Enforced: exactly 1 director per movie) |
| MOVIE **HAS_GENRE** GENRE | M:N | `[:HAS_GENRE]` | `(:Movie)-[:HAS_GENRE]->(:Genre)` | None |
| MOVIE **PRODUCED_BY** STUDIO | M:N | `[:PRODUCED_BY]` | `(:Movie)-[:PRODUCED_BY]->(:Studio)` | None |
| MOVIE **WINS** AWARD | M:N | `[:WINS]` | `(:Movie)-[:WINS]->(:Award)` | `year` (Integer), `result` (String, e.g. "Won" / "Nominated") |

---

## 4. Key Modeling & Architectural Decisions

1. **Ratings are Relationship Properties, Not Nodes**:
   In traditional relational design, ratings often form a junction table. In Neo4j, `(:User)-[:RATED {rating_value, rating_date}]->(:Movie)` treats rating as a first-class directed relationship property, enabling fast traversal without extra node overhead.
2. **Cardinality Enforcement via Transactions**:
   Since Neo4j Community Edition does not natively enforce maximum relationship degree constraints, cardinalities (e.g. 1 director per movie; 1 user and 1 movie per review) are enforced at the application transaction layer and validated by `validate_db.py`.
3. **Idempotent Writes via `MERGE`**:
   Users rating, watching, or watchlisting a film repeatedly update existing relationships rather than generating duplicates.
4. **Derived Attributes**:
   Both user `age` (from `user_dob`) and movie `avg_rating` (from `r.rating_value`) are computed on demand or cached strictly within write transactions to prevent data anomalies.
