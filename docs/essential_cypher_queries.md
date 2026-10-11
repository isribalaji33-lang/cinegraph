# Essential Cypher Queries for CineGraph

This document catalogs the 12 essential Cypher queries powering CineGraph, formatted for academic presentation and viva slides.

---

### Query 1: Top-Rated Movies Within a Genre
**Objective**: Finds the highest-rated movies in a given genre with a minimum rating threshold.
```cypher
MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre {genre_name: $genre_name})
MATCH (u:User)-[r:RATED]->(m)
WITH m, g, count(r) AS rating_count, avg(r.rating_value) AS avg_rating
WHERE rating_count >= $min_ratings
RETURN m.movie_id AS movie_id, m.title AS title, m.release_year AS release_year,
       m.duration AS duration, round(avg_rating, 2) AS avg_rating, rating_count, g.genre_name AS genre
ORDER BY avg_rating DESC, rating_count DESC
LIMIT $limit
```
- **Inputs**: `$genre_name` (e.g. `"Sci-Fi"`), `$min_ratings` (e.g. `5`), `$limit` (`10`)
- **DBMS Concept**: Indexed node lookup followed by single-pass aggregation preventing duplicate Cartesian products.

---

### Query 2: Actors Who Frequently Work Together
**Objective**: Multi-hop pattern mining co-starring networks.
```cypher
MATCH (a1:Actor)-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]->(a2:Actor)
WHERE a1.actor_id < a2.actor_id
WITH a1, a2, count(m) AS shared_movies, collect(m.title) AS movie_titles
WHERE shared_movies >= $min_shared
RETURN a1.actor_id AS actor1_id, a1.actor_name AS actor1_name,
       a2.actor_id AS actor2_id, a2.actor_name AS actor2_name,
       shared_movies, movie_titles
ORDER BY shared_movies DESC
LIMIT $limit
```
- **Inputs**: `$min_shared` (`2`), `$limit` (`10`)
- **DBMS Concept**: Symmetry breaking with `a1.actor_id < a2.actor_id` to avoid reverse pairing duplicates ($A-B$ vs $B-A$).

---

### Query 3: A User's Favorite Genres from Ratings
**Objective**: Derives personalized genre affinity by traversing rating edges.
```cypher
MATCH (u:User {user_id: $user_id})-[r:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
WITH g.genre_name AS genre_name, count(r) AS rated_count, avg(r.rating_value) AS avg_user_rating
RETURN genre_name, rated_count, round(avg_user_rating, 2) AS avg_user_rating
ORDER BY avg_user_rating DESC, rated_count DESC
LIMIT $limit
```
- **Inputs**: `$user_id` (`"u01"`), `$limit` (`5`)
- **DBMS Concept**: 2-hop traversal aggregating user preference weights.

---

### Query 4: Movies Similar to a Selected Movie (Graph Overlap)
**Objective**: Computes multi-attribute graph topological similarity.
```cypher
MATCH (m:Movie {movie_id: $movie_id})
MATCH (other:Movie) WHERE other.movie_id <> m.movie_id
OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)<-[:HAS_GENRE]-(other)
OPTIONAL MATCH (m)<-[:ACTED_IN]-(a:Actor)-[:ACTED_IN]->(other)
OPTIONAL MATCH (m)-[:DIRECTED_BY]->(d:Director)<-[:DIRECTED_BY]-(other)
WITH other,
     count(DISTINCT g) AS common_genres,
     count(DISTINCT a) AS common_actors,
     count(DISTINCT d) AS common_directors
WITH other, common_genres, common_actors, common_directors,
     (common_genres * 2.0 + common_actors * 3.0 + common_directors * 4.0) AS similarity_score
WHERE similarity_score > 0
RETURN other.movie_id AS movie_id, other.title AS title, other.release_year AS release_year,
       common_genres, common_actors, common_directors, similarity_score
ORDER BY similarity_score DESC
LIMIT $limit
```

---

### Query 5: Users with Similar Tastes (Co-Rating Network)
**Objective**: Discovers peer users with strong rating overlap.
```cypher
MATCH (u1:User {user_id: $user_id})-[r1:RATED]->(m:Movie)<-[r2:RATED]-(u2:User)
WHERE u1.user_id <> u2.user_id
WITH u1, u2, count(m) AS common_movies,
     collect(r1.rating_value) AS u1_ratings,
     collect(r2.rating_value) AS u2_ratings,
     collect(m.title) AS shared_titles
WHERE common_movies >= $min_common
RETURN u2.user_id AS similar_user_id, u2.username AS username, u2.country AS country,
       common_movies, shared_titles
ORDER BY common_movies DESC
LIMIT $limit
```

---

### Query 6: Collaborative Recommendations from Similar Users
**Objective**: 3-hop traversal recommending items liked by peers.
```cypher
MATCH (u1:User {user_id: $user_id})-[r1:RATED]->(m:Movie)<-[r2:RATED]-(u2:User)
WHERE u1.user_id <> u2.user_id AND r1.rating_value >= 4.0 AND r2.rating_value >= 4.0
WITH DISTINCT u2
MATCH (u2)-[r3:RATED]->(rec:Movie)
WHERE r3.rating_value >= 4.0
  AND NOT (u1)-[:RATED]->(rec)
  AND NOT (u1)-[:WATCHED]->(rec)
WITH rec, count(DISTINCT u2) AS recommending_users, avg(r3.rating_value) AS avg_similar_rating
RETURN rec.movie_id AS movie_id, rec.title AS title, rec.release_year AS release_year,
       recommending_users, round(avg_similar_rating, 2) AS avg_similar_rating
ORDER BY recommending_users DESC, avg_similar_rating DESC
LIMIT $limit
```

---

### Query 7: Recommendations via Content Graph DNA
**Objective**: Discovers candidates sharing directors, cast, and genres with high-rated anchors.
```cypher
MATCH (u:User {user_id: $user_id})-[r:RATED]->(liked:Movie)
WHERE r.rating_value >= 4.0
MATCH (rec:Movie)
WHERE rec.movie_id <> liked.movie_id
  AND NOT (u)-[:RATED]->(rec)
  AND NOT (u)-[:WATCHED]->(rec)
OPTIONAL MATCH (liked)-[:HAS_GENRE]->(g:Genre)<-[:HAS_GENRE]-(rec)
OPTIONAL MATCH (liked)<-[:ACTED_IN]-(a:Actor)-[:ACTED_IN]->(rec)
OPTIONAL MATCH (liked)-[:DIRECTED_BY]->(d:Director)<-[:DIRECTED_BY]-(rec)
WITH rec,
     count(DISTINCT g) AS shared_genres,
     count(DISTINCT a) AS shared_actors,
     count(DISTINCT d) AS shared_directors,
     collect(DISTINCT liked.title) AS anchor_titles
WITH rec, shared_genres, shared_actors, shared_directors, anchor_titles,
     (shared_genres * 1.5 + shared_actors * 2.5 + shared_directors * 3.5) AS graph_score
WHERE graph_score > 0
RETURN rec.movie_id AS movie_id, rec.title AS title, rec.release_year AS release_year,
       shared_genres, shared_actors, shared_directors, anchor_titles, graph_score
ORDER BY graph_score DESC
LIMIT $limit
```

---

### Query 8: A Director's Best-Performing Movies
```cypher
MATCH (d:Director {director_id: $director_id})<-[:DIRECTED_BY]-(m:Movie)
OPTIONAL MATCH (u:User)-[r:RATED]->(m)
WITH d, m, count(r) AS rating_count, avg(r.rating_value) AS avg_rating
RETURN d.director_name AS director_name, m.movie_id AS movie_id, m.title AS title,
       m.release_year AS release_year, coalesce(round(avg_rating, 2), 0.0) AS avg_rating, rating_count
ORDER BY avg_rating DESC, rating_count DESC
```

---

### Query 9: Rating Averages and Counts (Computed Derived Properties)
```cypher
MATCH (m:Movie)
OPTIONAL MATCH (u:User)-[r:RATED]->(m)
WITH m, count(r) AS rating_count, avg(r.rating_value) AS avg_rating
RETURN m.movie_id AS movie_id, m.title AS title,
       rating_count, coalesce(round(avg_rating, 2), 0.0) AS avg_rating
ORDER BY avg_rating DESC, rating_count DESC
LIMIT $limit
```

---

### Query 10: Popular Movies the User Has Not Watched
```cypher
MATCH (m:Movie)
WHERE NOT (:User {user_id: $user_id})-[:WATCHED]->(m)
  AND NOT (:User {user_id: $user_id})-[:RATED]->(m)
OPTIONAL MATCH (u:User)-[r:RATED]->(m)
WITH m, count(r) AS rating_count, avg(r.rating_value) AS avg_rating
WHERE rating_count >= $min_ratings
RETURN m.movie_id AS movie_id, m.title AS title, m.release_year AS release_year,
       rating_count, coalesce(round(avg_rating, 2), 0.0) AS avg_rating
ORDER BY avg_rating DESC, rating_count DESC
LIMIT $limit
```

---

### Query 11: Graph Neighborhood Around a Movie
```cypher
MATCH (m:Movie {movie_id: $movie_id})
OPTIONAL MATCH (m)-[:DIRECTED_BY]->(d:Director)
OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
OPTIONAL MATCH (m)-[:PRODUCED_BY]->(s:Studio)
OPTIONAL MATCH (m)-[w:WINS]->(aw:Award)
RETURN m.movie_id AS movie_id, m.title AS title,
       collect(DISTINCT {id: d.director_id, name: d.director_name}) AS directors,
       collect(DISTINCT {id: a.actor_id, name: a.actor_name}) AS actors,
       collect(DISTINCT {id: g.genre_id, name: g.genre_name}) AS genres,
       collect(DISTINCT {id: s.studio_id, name: s.studio_name}) AS studios,
       collect(DISTINCT {id: aw.award_id, name: aw.award_name, year: w.year, result: w.result}) AS awards
```

---

### Query 12: Admin Dashboard Analytics Aggregations
```cypher
CALL { MATCH (u:User) RETURN count(u) AS user_count }
CALL { MATCH (m:Movie) RETURN count(m) AS movie_count }
CALL { MATCH (a:Actor) RETURN count(a) AS actor_count }
CALL { MATCH (d:Director) RETURN count(d) AS director_count }
CALL { MATCH (g:Genre) RETURN count(g) AS genre_count }
CALL { MATCH (s:Studio) RETURN count(s) AS studio_count }
CALL { MATCH (aw:Award) RETURN count(aw) AS award_count }
CALL { MATCH (rw:Review) RETURN count(rw) AS review_count }
CALL { MATCH ()-[r:RATED]->() RETURN count(r) AS rated_count }
CALL { MATCH ()-[w:WATCHED]->() RETURN count(w) AS watched_count }
CALL { MATCH ()-[wl:ADDED_TO_WATCHLIST]->() RETURN count(wl) AS watchlist_count }
RETURN user_count, movie_count, actor_count, director_count, genre_count,
       studio_count, award_count, review_count, rated_count, watched_count, watchlist_count
```
