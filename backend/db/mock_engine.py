"""
Mock engine disabled.
CineGraph operates exclusively on live Neo4j (neo4j_live mode).
In-memory and fallback data sources are strictly disabled.
"""

raise RuntimeError(
    "In-memory fallback and mock data engine are disabled. "
    "CineGraph operates exclusively against live Neo4j via neo4j_live mode."
)
