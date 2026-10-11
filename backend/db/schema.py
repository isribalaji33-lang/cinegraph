"""
Neo4j Schema Definition and Initialization for CineGraph.
Defines uniqueness constraints for all ER entity keys and natural unique attributes,
along with query-accelerating b-tree/range indexes.
"""

import logging
from typing import List, Dict, Any
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

logger = logging.getLogger("cinegraph.schema")

# Uniqueness Constraints (Neo4j 5 syntax)
CONSTRAINTS = [
    {"name": "uq_user_id", "label": "User", "prop": "user_id", "cypher": "CREATE CONSTRAINT uq_user_id IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE"},
    {"name": "uq_user_username", "label": "User", "prop": "username", "cypher": "CREATE CONSTRAINT uq_user_username IF NOT EXISTS FOR (u:User) REQUIRE u.username IS UNIQUE"},
    {"name": "uq_user_email", "label": "User", "prop": "email", "cypher": "CREATE CONSTRAINT uq_user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE"},
    {"name": "uq_movie_id", "label": "Movie", "prop": "movie_id", "cypher": "CREATE CONSTRAINT uq_movie_id IF NOT EXISTS FOR (m:Movie) REQUIRE m.movie_id IS UNIQUE"},
    {"name": "uq_actor_id", "label": "Actor", "prop": "actor_id", "cypher": "CREATE CONSTRAINT uq_actor_id IF NOT EXISTS FOR (a:Actor) REQUIRE a.actor_id IS UNIQUE"},
    {"name": "uq_director_id", "label": "Director", "prop": "director_id", "cypher": "CREATE CONSTRAINT uq_director_id IF NOT EXISTS FOR (d:Director) REQUIRE d.director_id IS UNIQUE"},
    {"name": "uq_genre_id", "label": "Genre", "prop": "genre_id", "cypher": "CREATE CONSTRAINT uq_genre_id IF NOT EXISTS FOR (g:Genre) REQUIRE g.genre_id IS UNIQUE"},
    {"name": "uq_genre_name", "label": "Genre", "prop": "genre_name", "cypher": "CREATE CONSTRAINT uq_genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.genre_name IS UNIQUE"},
    {"name": "uq_studio_id", "label": "Studio", "prop": "studio_id", "cypher": "CREATE CONSTRAINT uq_studio_id IF NOT EXISTS FOR (s:Studio) REQUIRE s.studio_id IS UNIQUE"},
    {"name": "uq_award_id", "label": "Award", "prop": "award_id", "cypher": "CREATE CONSTRAINT uq_award_id IF NOT EXISTS FOR (w:Award) REQUIRE w.award_id IS UNIQUE"},
    {"name": "uq_review_id", "label": "Review", "prop": "review_id", "cypher": "CREATE CONSTRAINT uq_review_id IF NOT EXISTS FOR (r:Review) REQUIRE r.review_id IS UNIQUE"},
]

# Query-Optimizing Indexes
INDEXES = [
    {"name": "idx_movie_title", "label": "Movie", "prop": "title", "cypher": "CREATE INDEX idx_movie_title IF NOT EXISTS FOR (m:Movie) ON (m.title)"},
    {"name": "idx_movie_release_year", "label": "Movie", "prop": "release_year", "cypher": "CREATE INDEX idx_movie_release_year IF NOT EXISTS FOR (m:Movie) ON (m.release_year)"},
    {"name": "idx_movie_language", "label": "Movie", "prop": "language", "cypher": "CREATE INDEX idx_movie_language IF NOT EXISTS FOR (m:Movie) ON (m.language)"},
    {"name": "idx_actor_name", "label": "Actor", "prop": "actor_name", "cypher": "CREATE INDEX idx_actor_name IF NOT EXISTS FOR (a:Actor) ON (a.actor_name)"},
    {"name": "idx_director_name", "label": "Director", "prop": "director_name", "cypher": "CREATE INDEX idx_director_name IF NOT EXISTS FOR (d:Director) ON (d.director_name)"},
]

def init_schema() -> Dict[str, Any]:
    """Applies all constraints and indexes directly to live Neo4j."""
    if not is_neo4j_live():
        raise RuntimeError("Live Neo4j instance required for schema initialization. In-memory fallback is disabled.")

    results = {"constraints": [], "indexes": [], "mode": "neo4j_live"}

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        for c in CONSTRAINTS:
            try:
                session.run(c["cypher"])
                results["constraints"].append({"name": c["name"], "status": "applied", "label": c["label"], "prop": c["prop"]})
            except Exception as e:
                results["constraints"].append({"name": c["name"], "status": f"error: {str(e)}", "label": c["label"], "prop": c["prop"]})

        for idx in INDEXES:
            try:
                session.run(idx["cypher"])
                results["indexes"].append({"name": idx["name"], "status": "applied", "label": idx["label"], "prop": idx["prop"]})
            except Exception as e:
                results["indexes"].append({"name": idx["name"], "status": f"error: {str(e)}", "label": idx["label"], "prop": idx["prop"]})

    return results

def get_schema_summary() -> Dict[str, Any]:
    """Returns the list of active constraints and indexes from live Neo4j."""
    if not is_neo4j_live():
        raise RuntimeError("Live Neo4j instance required. In-memory fallback is disabled.")

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        constraints = [dict(record) for record in session.run("SHOW CONSTRAINTS")]
        indexes = [dict(record) for record in session.run("SHOW INDEXES")]
        return {"constraints": constraints, "indexes": indexes, "mode": "neo4j_live"}

if __name__ == "__main__":
    res = init_schema()
    print("Schema initialization result:", res)
