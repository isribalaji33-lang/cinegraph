"""
Database connection manager for CineGraph.
Connects directly to live Neo4j via official Python driver.
In-memory and fallback data paths are disabled; live Neo4j is the sole data source.
"""

import time
import logging
from typing import Dict, List, Any, Optional
from neo4j import GraphDatabase, Driver
from backend.config import settings

logger = logging.getLogger("cinegraph.db")
logger.setLevel(logging.INFO)

_driver: Optional[Driver] = None
_is_connected: bool = False
_connection_error: Optional[str] = None
_last_check_time: float = 0.0
CHECK_INTERVAL_SECONDS = 15.0

def get_driver() -> Optional[Driver]:
    global _driver, _is_connected, _connection_error, _last_check_time
    now = time.time()
    if _driver is None and (now - _last_check_time > CHECK_INTERVAL_SECONDS):
        _last_check_time = now
        try:
            _driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                max_connection_lifetime=30 * 60,
                max_connection_pool_size=50,
                connection_acquisition_timeout=30.0
            )
            _driver.verify_connectivity()
            _is_connected = True
            _connection_error = None
            logger.info("Successfully connected to Neo4j at %s", settings.NEO4J_URI)
        except Exception as e:
            _is_connected = False
            _connection_error = str(e)
            logger.error("Could not connect to Neo4j (%s). Live Neo4j connection is required.", e)
            _driver = None
    return _driver

def is_neo4j_live() -> bool:
    global _is_connected, _last_check_time
    now = time.time()
    if not _is_connected:
        if now - _last_check_time > CHECK_INTERVAL_SECONDS:
            drv = get_driver()
            return drv is not None and _is_connected
        return False
    return _is_connected

def check_connection() -> Dict[str, Any]:
    live = is_neo4j_live()
    return {
        "connected": live,
        "mode": "neo4j_live" if live else "offline",
        "uri": settings.NEO4J_URI,
        "database": settings.NEO4J_DATABASE,
        "error": _connection_error if not live else None,
        "details": "Connected to live Neo4j database (Exclusive data source: neo4j_live)" if live else f"Neo4j instance at {settings.NEO4J_URI} is offline. In-memory fallback is disabled; live Neo4j is strictly required."
    }

def close_driver():
    global _driver, _is_connected
    if _driver:
        _driver.close()
        _driver = None
        _is_connected = False
        logger.info("Neo4j driver closed.")
