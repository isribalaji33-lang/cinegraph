"""
Analytics API Router for CineGraph.
ALL data is sourced exclusively from live Neo4j via Cypher queries.
Provides high-level database metrics, popular genres, frequent co-starring pairs,
director performance rankings, and graph connectivity stats.
"""

from fastapi import APIRouter, HTTPException
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
def get_analytics_overview():
    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required.")

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:

        # 1. Node counts – straight from the graph
        count_recs = session.run("""
            CALL {
                MATCH (u:User)    RETURN 'Users'     AS label, count(u) AS n
                UNION ALL
                MATCH (m:Movie)   RETURN 'Movies'    AS label, count(m) AS n
                UNION ALL
                MATCH (d:Director) RETURN 'Directors' AS label, count(d) AS n
                UNION ALL
                MATCH (a:Actor)   RETURN 'Actors'    AS label, count(a) AS n
                UNION ALL
                MATCH (g:Genre)   RETURN 'Genres'    AS label, count(g) AS n
                UNION ALL
                MATCH (s:Studio)  RETURN 'Studios'   AS label, count(s) AS n
                UNION ALL
                MATCH (r:Review)  RETURN 'Reviews'   AS label, count(r) AS n
            }
            RETURN label, n
        """).data()
        node_counts = {rec["label"]: rec["n"] for rec in count_recs}

        # 2. Frequent co-starring pairs
        co_recs = session.run("""
            MATCH (a1:Actor)-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(a2:Actor)
            WHERE id(a1) < id(a2)
            WITH a1, a2, collect(m.title) AS titles, count(m) AS shared
            WHERE shared >= 2
            RETURN a1.actor_name AS actor_1, a2.actor_name AS actor_2,
                   shared AS shared_movies, titles
            ORDER BY shared DESC
            LIMIT 6
        """).data()
        co_stars = [
            {
                "actor_1": r["actor_1"],
                "actor_2": r["actor_2"],
                "shared_movies": r["shared_movies"],
                "titles": r["titles"]
            }
            for r in co_recs
        ]

        # 3. Top genres by movie count
        genre_recs = session.run("""
            MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre)
            RETURN g.genre_name AS genre, count(m) AS movie_count
            ORDER BY movie_count DESC
            LIMIT 15
        """).data()
        top_genres = [{"genre": r["genre"], "movie_count": r["movie_count"]} for r in genre_recs]

        # 4. Director performance (avg rating from RATED edges)
        dir_recs = session.run("""
            MATCH (d:Director)<-[:DIRECTED_BY]-(m:Movie)
            OPTIONAL MATCH ()-[r:RATED]->(m)
            WITH d, m, avg(r.rating_value) AS movie_avg
            WITH d,
                 count(m) AS movies_count,
                 round(avg(coalesce(movie_avg, 0)) * 100) / 100 AS avg_rating,
                 collect(m.title)[0] AS sample_film
            RETURN d.director_id AS director_id,
                   d.director_name AS director_name,
                   d.nationality AS nationality,
                   movies_count, avg_rating, sample_film
            ORDER BY avg_rating DESC
            LIMIT 8
        """).data()
        top_directors = [
            {
                "director_id": r["director_id"],
                "director_name": r["director_name"],
                "nationality": r["nationality"],
                "movies_count": r["movies_count"],
                "avg_rating": float(r["avg_rating"] or 0),
                "sample_film": r["sample_film"] or ""
            }
            for r in dir_recs
        ]

        # 5. Highest-rated movies (min 3 ratings for statistical relevance)
        top_movie_recs = session.run("""
            MATCH (m:Movie)
            OPTIONAL MATCH ()-[r:RATED]->(m)
            WITH m, count(r) AS ratings_count, round(avg(r.rating_value) * 100) / 100 AS avg_rating
            WHERE ratings_count >= 3
            OPTIONAL MATCH (m)-[:DIRECTED_BY]->(d:Director)
            RETURN m.title AS title, m.release_year AS year,
                   avg_rating, ratings_count, d.director_name AS director
            ORDER BY avg_rating DESC
            LIMIT 10
        """).data()
        highest_rated_movies = [
            {
                "title": r["title"],
                "year": r["year"],
                "avg_rating": float(r["avg_rating"] or 0),
                "ratings_count": r["ratings_count"],
                "director": r["director"] or "Unknown"
            }
            for r in top_movie_recs
        ]

        # 6. Relationship counts for graph health overview
        rel_recs = session.run("""
            CALL {
                MATCH ()-[r:RATED]->()          RETURN 'RATED'             AS rel, count(r) AS n
                UNION ALL
                MATCH ()-[r:WATCHED]->()        RETURN 'WATCHED'           AS rel, count(r) AS n
                UNION ALL
                MATCH ()-[r:ACTED_IN]->()       RETURN 'ACTED_IN'          AS rel, count(r) AS n
                UNION ALL
                MATCH ()-[r:DIRECTED_BY]->()    RETURN 'DIRECTED_BY'       AS rel, count(r) AS n
                UNION ALL
                MATCH ()-[r:HAS_GENRE]->()      RETURN 'HAS_GENRE'         AS rel, count(r) AS n
                UNION ALL
                MATCH ()-[r:ADDED_TO_WATCHLIST]->() RETURN 'WATCHLIST'     AS rel, count(r) AS n
                UNION ALL
                MATCH ()-[r:WROTE]->()          RETURN 'WROTE'             AS rel, count(r) AS n
            }
            RETURN rel, n
        """).data()
        rel_counts = {rec["rel"]: rec["n"] for rec in rel_recs}

    return {
        "node_counts": node_counts,
        "co_stars": co_stars,
        "top_genres": top_genres,
        "top_directors": top_directors,
        "highest_rated_movies": highest_rated_movies,
        "relationship_counts": rel_counts
    }
