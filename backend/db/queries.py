"""
CineGraph Cypher Query Repository.
Contains all 12 essential Cypher queries required by the specification,
plus curated query catalogue for the Neo4j Live Lab with EXPLAIN/PROFILE plans.
"""

from typing import Dict, Any, List

CYPHER_QUERIES = {
    # 1. Top-rated movies within a genre
    "top_rated_in_genre": """
        MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre {genre_name: $genre_name})
        MATCH (u:User)-[r:RATED]->(m)
        WITH m, g, count(r) AS rating_count, avg(r.rating_value) AS avg_rating
        WHERE rating_count >= $min_ratings
        RETURN m.movie_id AS movie_id, m.title AS title, m.release_year AS release_year,
               m.duration AS duration, round(avg_rating, 2) AS avg_rating, rating_count, g.genre_name AS genre
        ORDER BY avg_rating DESC, rating_count DESC
        LIMIT $limit
    """,

    # 2. Actors who frequently work together
    "actors_frequently_co_star": """
        MATCH (a1:Actor)-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]->(a2:Actor)
        WHERE a1.actor_id < a2.actor_id
        WITH a1, a2, count(m) AS shared_movies, collect(m.title) AS movie_titles
        WHERE shared_movies >= $min_shared
        RETURN a1.actor_id AS actor1_id, a1.actor_name AS actor1_name,
               a2.actor_id AS actor2_id, a2.actor_name AS actor2_name,
               shared_movies, movie_titles
        ORDER BY shared_movies DESC
        LIMIT $limit
    """,

    # 3. User's favorite genres from ratings
    "user_favorite_genres": """
        MATCH (u:User {user_id: $user_id})-[r:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
        WITH g.genre_name AS genre_name, count(r) AS rated_count, avg(r.rating_value) AS avg_user_rating
        RETURN genre_name, rated_count, round(avg_user_rating, 2) AS avg_user_rating
        ORDER BY avg_user_rating DESC, rated_count DESC
        LIMIT $limit
    """,

    # 4. Similar movies via content & cast overlap
    "similar_movies_graph": """
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
    """,

    # 5. Users with similar tastes from commonly rated movies
    "similar_users": """
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
    """,

    # 6. Recommendations from similar users
    "recommendations_similar_users": """
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
    """,

    # 7. Recommendations sharing genres, actors, directors with highly-rated movies
    "recommendations_content_graph": """
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
    """,

    # 8. Director's best-performing movies
    "director_best_movies": """
        MATCH (d:Director {director_id: $director_id})<-[:DIRECTED_BY]-(m:Movie)
        OPTIONAL MATCH (u:User)-[r:RATED]->(m)
        WITH d, m, count(r) AS rating_count, avg(r.rating_value) AS avg_rating
        RETURN d.director_name AS director_name, m.movie_id AS movie_id, m.title AS title,
               m.release_year AS release_year, coalesce(round(avg_rating, 2), 0.0) AS avg_rating, rating_count
        ORDER BY avg_rating DESC, rating_count DESC
    """,

    # 9. Rating averages and counts (aggregations)
    "rating_averages_and_counts": """
        MATCH (m:Movie)
        OPTIONAL MATCH (u:User)-[r:RATED]->(m)
        WITH m, count(r) AS rating_count, avg(r.rating_value) AS avg_rating
        RETURN m.movie_id AS movie_id, m.title AS title,
               rating_count, coalesce(round(avg_rating, 2), 0.0) AS avg_rating
        ORDER BY avg_rating DESC, rating_count DESC
        LIMIT $limit
    """,

    # 10. Popular movies the user has not watched
    "popular_unwatched_movies": """
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
    """,

    # 11. Graph neighborhood around a movie
    "movie_graph_neighborhood": """
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
    """,

    # 12. Admin dashboard analytics totals
    "admin_dashboard_counts": """
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
    """
}

# Live Lab Curated Query Catalogue (Allowlisted, parameter-supported queries with traversal paths)
LIVE_LAB_QUERIES = [
    {
        "id": "lab_collab_traversal",
        "title": "2-Hop Collaborative Taste Traversal",
        "description": "Traverse from target user to co-raters who also rated their favorite movies 5★, then discover candidates those peers rated 5★.",
        "path_pattern": "User(u01) → [:RATED 5★] → Movie(m01) ← [:RATED 5★] ← PeerUser(u04) → [:RATED 5★] → CandidateMovie(m08)",
        "traversal_hops": [
            {"hop": 1, "from": "User (u01)", "rel": "RATED (5★)", "to": "Movie (Liked)"},
            {"hop": 2, "from": "Movie", "rel": "RATED (5★, reverse)", "to": "Peer User with Aligned Taste"},
            {"hop": 3, "from": "Peer User", "rel": "RATED (5★)", "to": "Unseen Candidate Movie"}
        ],
        "cypher": """MATCH (u:User {user_id: $user_id})-[r1:RATED]->(m1:Movie)<-[r2:RATED]-(peer:User)
WHERE u.user_id <> peer.user_id AND r1.rating_value >= 4.5 AND r2.rating_value >= 4.5
MATCH (peer)-[r3:RATED]->(candidate:Movie)
WHERE r3.rating_value >= 4.5
  AND NOT (u)-[:RATED]->(candidate)
RETURN u.username AS user, m1.title AS pivot_movie, peer.username AS peer_user,
       candidate.title AS recommended_movie, r3.rating_value AS peer_rating
ORDER BY peer_rating DESC
LIMIT 10""",
        "default_params": {"user_id": "u01"}
    },
    {
        "id": "lab_director_graph",
        "title": "Auteur Signature: Director & Cast Bridges",
        "description": "Find movies that share both the director and key actors of movies this user loved.",
        "path_pattern": "User → [:RATED] → Liked Movie → [:DIRECTED_BY] → Director ← [:DIRECTED_BY] ← Candidate Movie",
        "traversal_hops": [
            {"hop": 1, "from": "User", "rel": "RATED >= 4.0", "to": "Anchor Movie"},
            {"hop": 2, "from": "Anchor Movie", "rel": "DIRECTED_BY", "to": "Director"},
            {"hop": 3, "from": "Director", "rel": "DIRECTED_BY (reverse)", "to": "Candidate Movie"}
        ],
        "cypher": """MATCH (u:User {user_id: $user_id})-[r:RATED]->(m:Movie)-[:DIRECTED_BY]->(d:Director)<-[:DIRECTED_BY]-(candidate:Movie)
WHERE r.rating_value >= 4.0 AND candidate.movie_id <> m.movie_id
  AND NOT (u)-[:RATED]->(candidate)
OPTIONAL MATCH (m)<-[:ACTED_IN]-(a:Actor)-[:ACTED_IN]->(candidate)
RETURN m.title AS anchor_movie, d.director_name AS director,
       collect(DISTINCT a.actor_name) AS shared_actors,
       candidate.title AS candidate_movie, candidate.release_year AS year
LIMIT 10""",
        "default_params": {"user_id": "u01"}
    },
    {
        "id": "lab_costar_cluster",
        "title": "Actor Co-starring Multi-hop Network",
        "description": "Traverses M:N ACTED_IN relationships to discover dense collaborator clusters.",
        "path_pattern": "Actor 1 → [:ACTED_IN] → Movie ← [:ACTED_IN] ← Actor 2",
        "traversal_hops": [
            {"hop": 1, "from": "Actor 1", "rel": "ACTED_IN", "to": "Shared Movie"},
            {"hop": 2, "from": "Shared Movie", "rel": "ACTED_IN (reverse)", "to": "Actor 2"}
        ],
        "cypher": """MATCH (a1:Actor)-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]->(a2:Actor)
WHERE a1.actor_id < a2.actor_id
WITH a1, a2, count(m) AS co_appearances, collect(m.title) AS films
WHERE co_appearances >= 2
RETURN a1.actor_name AS actor_1, a2.actor_name AS actor_2,
       co_appearances, films
ORDER BY co_appearances DESC
LIMIT 10""",
        "default_params": {}
    },
    {
        "id": "lab_genre_affinity",
        "title": "User Multi-genre Affinity Aggregation",
        "description": "Calculates user rating distribution across genre nodes using single-pass aggregation.",
        "path_pattern": "User → [:RATED] → Movie → [:HAS_GENRE] → Genre",
        "traversal_hops": [
            {"hop": 1, "from": "User", "rel": "RATED", "to": "Watched Movie"},
            {"hop": 2, "from": "Watched Movie", "rel": "HAS_GENRE", "to": "Genre Node"}
        ],
        "cypher": """MATCH (u:User {user_id: $user_id})-[r:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
WITH g.genre_name AS genre, count(r) AS count, avg(r.rating_value) AS avg_rating
RETURN genre, count, round(avg_rating, 2) AS user_avg_rating
ORDER BY user_avg_rating DESC, count DESC""",
        "default_params": {"user_id": "u01"}
    }
]
