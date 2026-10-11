"""
Graph Explorer API Router for CineGraph.
Provides Cytoscape graph elements (nodes and edges) for interactive graph exploration,
neighbor expansion, and property inspection.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query
from backend.seed.seed_data import MOVIES, DIRECTORS, ACTORS, GENRES, USERS
from backend.db.connection import get_driver, is_neo4j_live
from backend.config import settings

router = APIRouter(prefix="/api/graph", tags=["Graph Explorer"])

COLOR_MAP = {
    "Movie": "#ef4444",      # Crimson / Red
    "User": "#8b5cf6",       # Purple
    "Director": "#f59e0b",   # Amber / Gold
    "Actor": "#10b981",      # Emerald / Green
    "Genre": "#06b6d4",      # Cyan
    "Studio": "#6366f1",     # Indigo
    "Award": "#ec4899",      # Pink
    "Review": "#64748b"      # Slate
}

@router.get("/explore")
def explore_graph(
    center_movie_id: Optional[str] = Query(None, description="Focal movie id to expand"),
    node_types: Optional[str] = Query("Movie,Director,Actor,Genre", description="Comma separated labels to include"),
    limit: int = Query(50, ge=10, le=200)
):
    selected_labels = set(node_types.split(",")) if node_types else {"Movie", "Director", "Actor", "Genre"}

    nodes = {}
    edges = []
    edge_set = set()

    # If center movie is chosen, expand its neighborhood
    focal_mids = [center_movie_id] if center_movie_id else [m["movie_id"] for m in MOVIES[:10]]

    for mid in focal_mids:
        m = next((m for m in MOVIES if m["movie_id"] == mid), None)
        if not m:
            continue

        # Add Movie node
        if "Movie" in selected_labels and m["movie_id"] not in nodes:
            nodes[m["movie_id"]] = {
                "data": {
                    "id": m["movie_id"],
                    "label": m["title"],
                    "type": "Movie",
                    "color": COLOR_MAP["Movie"],
                    "properties": {
                        "release_year": m["release_year"],
                        "duration": m["duration"],
                        "language": m["language"],
                        "age_rating": m["age_rating"]
                    }
                }
            }

        # Add Director
        if "Director" in selected_labels:
            d = next((d for d in DIRECTORS if d["director_id"] == m["director"]), None)
            if d:
                if d["director_id"] not in nodes:
                    nodes[d["director_id"]] = {
                        "data": {
                            "id": d["director_id"],
                            "label": d["director_name"],
                            "type": "Director",
                            "color": COLOR_MAP["Director"],
                            "properties": {"nationality": d["nationality"], "dob": d["director_dob"]}
                        }
                    }
                e_id = f"{m['movie_id']}->{d['director_id']}"
                if e_id not in edge_set:
                    edge_set.add(e_id)
                    edges.append({"data": {"id": e_id, "source": m["movie_id"], "target": d["director_id"], "label": "DIRECTED_BY"}})

        # Add Actors
        if "Actor" in selected_labels:
            for aid in m["actors"]:
                a = next((act for act in ACTORS if act["actor_id"] == aid), None)
                if a:
                    if a["actor_id"] not in nodes:
                        nodes[a["actor_id"]] = {
                            "data": {
                                "id": a["actor_id"],
                                "label": a["actor_name"],
                                "type": "Actor",
                                "color": COLOR_MAP["Actor"],
                                "properties": {"nationality": a["actor_nationality"], "dob": a["actor_dob"]}
                            }
                        }
                    e_id = f"{a['actor_id']}->{m['movie_id']}"
                    if e_id not in edge_set:
                        edge_set.add(e_id)
                        edges.append({"data": {"id": e_id, "source": a["actor_id"], "target": m["movie_id"], "label": "ACTED_IN"}})

        # Add Genres
        if "Genre" in selected_labels:
            for gid in m["genres"]:
                g = next((gen for gen in GENRES if gen["genre_id"] == gid), None)
                if g:
                    if g["genre_id"] not in nodes:
                        nodes[g["genre_id"]] = {
                            "data": {
                                "id": g["genre_id"],
                                "label": g["genre_name"],
                                "type": "Genre",
                                "color": COLOR_MAP["Genre"],
                                "properties": {"genre_name": g["genre_name"]}
                            }
                        }
                    e_id = f"{m['movie_id']}->{g['genre_id']}"
                    if e_id not in edge_set:
                        edge_set.add(e_id)
                        edges.append({"data": {"id": e_id, "source": m["movie_id"], "target": g["genre_id"], "label": "HAS_GENRE"}})

        if len(nodes) >= limit:
            break

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
        "count_nodes": len(nodes),
        "count_edges": len(edges)
    }

@router.get("/node/{node_id}/neighbors")
def get_node_neighbors(node_id: str):
    """Dynamically fetches all adjacent nodes and relationships for interactive graph expansion."""
    nodes = {}
    edges = []
    edge_set = set()

    if not is_neo4j_live():
        raise HTTPException(status_code=503, detail="Live Neo4j instance required. In-memory fallback is disabled.")

    driver = get_driver()
    with driver.session(database=settings.NEO4J_DATABASE) as session:
        recs = session.run("""
            MATCH (center {id: $nid})-[r]-(neighbor)
            RETURN type(r) AS rel_type, startNode(r) = center AS is_outgoing,
                   labels(neighbor)[0] AS n_label, properties(neighbor) AS n_props
            LIMIT 25
        """, {"nid": node_id}).data()
        for rec in recs:
            props = rec["n_props"]
            target_id = props.get("movie_id") or props.get("user_id") or props.get("actor_id") or props.get("director_id") or props.get("genre_id")
            if not target_id: continue
            n_type = rec["n_label"]
            name = props.get("title") or props.get("username") or props.get("actor_name") or props.get("director_name") or props.get("genre_name")
            nodes[target_id] = {
                "data": {
                    "id": target_id,
                    "label": name,
                    "type": n_type,
                    "color": COLOR_MAP.get(n_type, "#94a3b8"),
                    "properties": props
                }
            }
            src = node_id if rec["is_outgoing"] else target_id
            dst = target_id if rec["is_outgoing"] else node_id
            edges.append({"data": {"id": f"{src}->{dst}", "source": src, "target": dst, "label": rec["rel_type"]}})

    return {
        "nodes": list(nodes.values()),
        "edges": edges
    }
