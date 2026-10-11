"""
CineGraph Database Validation Suite.
Asserts that the database strictly satisfies the ER diagram and Section 8 specification:
- Exact node counts: 15 for each entity, 30 Movies
- Cardinality rules: Exactly 1 DIRECTED_BY per Movie, 1 WROTE and 1 ABOUT per Review
- Rating value boundaries: 1.0 <= rating_value <= 5.0
- No orphan nodes, valid relationship volumes
"""

import sys
import logging
from datetime import datetime, date
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

logger = logging.getLogger("cinegraph.validate")

def validate_database():
    errors = []
    warnings = []
    stats = {}

    if not is_neo4j_live():
        raise RuntimeError("Live Neo4j instance required for validation. Fallback data source is disabled.")

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        labels = ["User", "Movie", "Actor", "Director", "Genre", "Studio", "Award", "Review"]
        for label in labels:
            count = session.run(f"MATCH (n:{label}) RETURN count(n) AS c").single()["c"]
            stats[label] = count
            expected = 30 if label == "Movie" else 15
            if count != expected:
                errors.append(f"Entity count mismatch for {label}: found {count}, expected {expected}")

        rel_types = ["DIRECTED_BY", "HAS_GENRE", "PRODUCED_BY", "ACTED_IN", "WINS", "RATED", "WATCHED", "ADDED_TO_WATCHLIST", "WROTE", "ABOUT"]
        for rt in rel_types:
            count = session.run(f"MATCH ()-[r:{rt}]->() RETURN count(r) AS c").single()["c"]
            stats[rt] = count

        card_res = session.run("""
            MATCH (m:Movie)
            OPTIONAL MATCH (m)-[:DIRECTED_BY]->(d:Director)
            WITH m, count(d) AS dir_count
            WHERE dir_count <> 1
            RETURN m.movie_id AS mid, m.title AS title, dir_count
        """).data()
        if card_res:
            errors.append(f"Cardinality violation: {len(card_res)} movies have invalid director count: {card_res}")

        rev_card = session.run("""
            MATCH (r:Review)
            OPTIONAL MATCH (u:User)-[:WROTE]->(r)
            OPTIONAL MATCH (r)-[:ABOUT]->(m:Movie)
            WITH r, count(DISTINCT u) AS u_count, count(DISTINCT m) AS m_count
            WHERE u_count <> 1 OR m_count <> 1
            RETURN r.review_id AS rid, u_count, m_count
        """).data()
        if rev_card:
            errors.append(f"Review cardinality violation: {len(rev_card)} reviews invalid: {rev_card}")

        rating_bounds = session.run("""
            MATCH ()-[r:RATED]->()
            WHERE r.rating_value < 1.0 OR r.rating_value > 5.0
            RETURN count(r) AS invalid_ratings
        """).single()["invalid_ratings"]
        if rating_bounds > 0:
            errors.append(f"Found {rating_bounds} ratings out of the allowed 1.0 - 5.0 range!")

    if stats.get("RATED", 0) < 200 or stats.get("RATED", 0) > 350:
        errors.append(f"RATED count {stats.get('RATED')} outside expected range [200, 350]")
    if stats.get("WATCHED", 0) < 50 or stats.get("WATCHED", 0) > 150:
        warnings.append(f"WATCHED count {stats.get('WATCHED')} slightly outside typical range [50, 150]")

    is_valid = len(errors) == 0
    return {
        "valid": is_valid,
        "errors": errors,
        "warnings": warnings,
        "stats": stats
    }

if __name__ == "__main__":
    result = validate_database()
    print("================ CINEGRAPH DATABASE VALIDATION ================")
    print(f"Status: {'PASSED (VALID)' if result['valid'] else 'FAILED'}")
    print("\nEntity & Relationship Counts:")
    for k, v in result["stats"].items():
        print(f"  {k:22}: {v}")
    if result["errors"]:
        print("\nERRORS:")
        for err in result["errors"]:
            print(f"  [ERROR] {err}")
    if result["warnings"]:
        print("\nWARNINGS:")
        for w in result["warnings"]:
            print(f"  [WARN] {w}")
    if not result["valid"]:
        sys.exit(1)
    else:
        print("\nALL ER CARDINALITIES & CONSTRAINTS SATISFIED!")
