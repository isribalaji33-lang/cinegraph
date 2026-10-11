"""
CineGraph FastAPI Main Application Server.
Directs all API routers, database lifecycle events, CORS middleware,
and system health checks.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.db.connection import check_connection, close_driver
from backend.db.schema import init_schema
from backend.seed.seed_data import seed_database
from backend.seed.validate_db import validate_database

# Routers
from backend.routes.movies import router as movies_router
from backend.routes.recommendations import router as recommendations_router
from backend.routes.users import router as users_router
from backend.routes.lab import router as lab_router
from backend.routes.graph import router as graph_router
from backend.routes.analytics import router as analytics_router
from backend.routes.admin import router as admin_router
from backend.routes.ml_eval import router as ml_eval_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("cinegraph.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize schema and ensure seed dataset is loaded
    logger.info("Initializing CineGraph Backend...")
    conn = check_connection()
    logger.info("Database connectivity check: %s (%s)", conn["mode"], conn["details"])

    try:
        init_schema()
        seed_database()
        val = validate_database()
        logger.info("Initial database validation: %s", "PASSED" if val["valid"] else "FAILED")
    except Exception as e:
        logger.error("Error during startup database initialization: %s", e)

    yield

    # Shutdown
    logger.info("Shutting down CineGraph Backend...")
    close_driver()

app = FastAPI(
    title="CineGraph API",
    description="Intelligent Movie Recommendation System with Neo4j Graph Database & Machine Learning",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(movies_router)
app.include_router(recommendations_router)
app.include_router(users_router)
app.include_router(lab_router)
app.include_router(graph_router)
app.include_router(analytics_router)
app.include_router(admin_router)
app.include_router(ml_eval_router)

@app.get("/api/health", tags=["Health"])
def health_check():
    """System health check endpoint verifying database connectivity."""
    conn = check_connection()
    return {
        "status": "healthy",
        "app_name": "CineGraph",
        "tagline": "Discover the connections. Find your next favorite.",
        "database": conn,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.BACKEND_HOST, port=settings.BACKEND_PORT, reload=True)
