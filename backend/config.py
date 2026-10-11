import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_USERNAME: Optional[str] = None
    NEO4J_PASSWORD: str = ""
    NEO4J_DATABASE: str = "neo4j"

    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000
    ENVIRONMENT: str = "development"
    ALLOW_ARBITRARY_CYPHER: bool = True

    SECRET_KEY: str = "cinegraph-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    TMDB_API_KEY: Optional[str] = None

    def model_post_init(self, __context):
        if self.NEO4J_USERNAME and (self.NEO4J_USER == "neo4j" or not self.NEO4J_USER):
            self.NEO4J_USER = self.NEO4J_USERNAME
        if self.NEO4J_DATABASE == "neo4j" and self.NEO4J_USER != "neo4j":
            self.NEO4J_DATABASE = self.NEO4J_USER

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
