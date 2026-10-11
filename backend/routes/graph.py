"""
Graph Explorer API Router for CineGraph.
ALL data is sourced exclusively from live Neo4j via Cypher queries.
Provides Cytoscape graph elements (nodes and edges) for interactive graph exploration,
neighbor expansion, and property inspection.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

router = APIRouter(prefix="/api/graph", tags=["Graph Explorer"])

COLOR_MAP = {
    "Movie":    "#ef4444",
    "User":     "#8b5cf6",
    "Director": "#f59e0b",
    "Actor":    "#10b981",
    "Genre":    "#06b6d4",
    "Studio":   "#6366f1",
    "Award":    "#ec4899",
    "Review":   "#64748b",
}


def _node_id(props: dict) -> Optional[str]:
    return (
        props.get("movie_id")
        or props.get("user_id")
        or props.get("actor_id")
        or props.get("director_id")
        or props.get("genre_id")
        or props.get("studio_id")
        or props.get("award_id")
        or props.get("review_id")
    )


def _node_label(props: dict) -> str:
    return (
        props.get("title")
        or props.get("username")
        or props.get("actor_name")
        or props.get("director_name")
        or props.get("genre_name")
        or props.get("studio_name")
        or props.get("award_name")
        or props.get("review_id")
        or "?"
    )


@router.get("/explore")
def explore_graph(
    center_movie_id: Optional[str] = Query(None, description="Focal movie id to expand"),
    node_types: Optional[str] = Query("Movie,Director,Actor,Genre", description="Comma-separated labels to include"),
    limit: int = Query(60, ge=10, le=200),
):
    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required.")

    selected_labels = set(node_types.split(",")) if node_types else {"Movie", "Director", "Actor", "Genre"}

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:

        # Build the Cypher for focal movie(s)
        if center_movie_id:
            # 1-hop neighbourhood of chosen movie
            records = session.run("""
                MATCH (focal:Movie {movie_id: $mid})
                OPTIONAL MATCH (focal)-[r1:DIRECTED_BY]->(d:Director)
                OPTIONAL MATCH (a:Actor)-[r2:ACTED_IN]->(focal)
                OPTIONAL MATCH (focal)-[r3:HAS_GENRE]->(g:Genre)
                OPTIONAL MATCH (u:User)-[r4:RATED]->(focal)
                RETURN focal, d, a, g, collect(DISTINCT u)[0] AS sample_user
                LIMIT $lim
            """, {"mid": center_movie_id, "lim": limit}).data()
        else:
            # Sample popular movies
            records = session.run("""
                MATCH (m:Movie)
                WITH m ORDER BY m.movie_id LIMIT 12
                OPTIONAL MATCH (m)-[:DIRECTED_BY]->(d:Director)
                OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
                OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
                RETURN m AS focal, d, collect(DISTINCT a)[0] AS a, collect(DISTINCT g)[0] AS g, null AS sample_user
            """, {"lim": limit}).data()

        nodes: dict = {}
        edges: list = []
        edge_set: set = set()

        def add_node(n_id, label, n_type, props):
            if n_id and n_id not in nodes:
                nodes[n_id] = {
                    "data": {
                        "id": n_id,
                        "label": label,
                        "type": n_type,
                        "color": COLOR_MAP.get(n_type, "#94a3b8"),
                        "properties": {k: v for k, v in props.items() if not k.startswith("_")}
                    }
                }

        def add_edge(src, dst, rel):
            e_id = f"{src}->{dst}-{rel}"
            if src and dst and e_id not in edge_set:
                edge_set.add(e_id)
                edges.append({"data": {"id": e_id, "source": src, "target": dst, "label": rel}})

        for rec in records:
            focal = rec.get("focal")
            d = rec.get("d")
            a = rec.get("a")
            g = rec.get("g")

            if focal and "Movie" in selected_labels:
                fp = dict(focal)
                mid = fp.get("movie_id")
                add_node(mid, fp.get("title", mid), "Movie", fp)

                if d and "Director" in selected_labels:
                    dp = dict(d)
                    did = dp.get("director_id")
                    add_node(did, dp.get("director_name", did), "Director", dp)
                    add_edge(mid, did, "DIRECTED_BY")

                if a and "Actor" in selected_labels:
                    ap = dict(a)
                    aid = ap.get("actor_id")
                    add_node(aid, ap.get("actor_name", aid), "Actor", ap)
                    add_edge(aid, mid, "ACTED_IN")

                if g and "Genre" in selected_labels:
                    gp = dict(g)
                    gid = gp.get("genre_id")
                    add_node(gid, gp.get("genre_name", gid), "Genre", gp)
                    add_edge(mid, gid, "HAS_GENRE")

            if len(nodes) >= limit:
                break

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
        "count_nodes": len(nodes),
        "count_edges": len(edges),
    }


@router.get("/node/{node_id}/neighbors")
def get_node_neighbors(node_id: str):
    """Dynamically fetches all adjacent nodes and relationships for interactive graph expansion."""
    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required.")

    driver = get_driver()
    nodes: dict = {}
    edges: list = []

    with driver.session(database=settings.NEO4J_DATABASE) as session:
        # Try matching by any known id property
        recs = session.run("""
            MATCH (center)
            WHERE center.movie_id = $nid
               OR center.actor_id = $nid
               OR center.director_id = $nid
               OR center.genre_id = $nid
               OR center.user_id = $nid
               OR center.studio_id = $nid
            MATCH (center)-[r]-(neighbor)
            RETURN type(r) AS rel_type,
                   startNode(r) = center AS is_outgoing,
                   labels(neighbor)[0] AS n_label,
                   properties(neighbor) AS n_props
            LIMIT 30
        """, {"nid": node_id}).data()

        for rec in recs:
            props = rec["n_props"]
            target_id = _node_id(props)
            if not target_id:
                continue
            n_type = rec["n_label"]
            name = _node_label(props)
            nodes[target_id] = {
                "data": {
                    "id": target_id,
                    "label": name,
                    "type": n_type,
                    "color": COLOR_MAP.get(n_type, "#94a3b8"),
                    "properties": props,
                }
            }
            src = node_id if rec["is_outgoing"] else target_id
            dst = target_id if rec["is_outgoing"] else node_id
            edges.append({"data": {"id": f"{src}->{dst}", "source": src, "target": dst, "label": rec["rel_type"]}})

    return {"nodes": list(nodes.values()), "edges": edges}
