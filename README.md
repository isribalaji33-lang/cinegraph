# CineGraph — An Intelligent Movie Recommendation System with Neo4j & ML

> **Tagline:** *Discover the connections. Find your next favorite.*

CineGraph is a comprehensive DBMS and Machine Learning application where **Neo4j is the central database**. The system is built around a directed property graph representing users, movies, directors, actors, genres, studios, awards, and reviews. Recommendations are calculated using an explainable hybrid recommendation engine combining collaborative filtering, content-based similarity, graph topological traversals, and critical acclaim baselines.

---

## 🏛️ The Three Demo Pillars

### Pillar 1 — Neo4j is the Star (`/lab`)
- **Neo4j Live Lab**: An interactive laboratory allowing presenters and faculty to execute curated, allowlisted Cypher queries or custom read-only Cypher.
- **Physical Execution Plan**: Inspect real measured execution timings (in milliseconds), row counts, and `PROFILE`/`EXPLAIN` plan operators and database hits directly from the Neo4j engine.
- **Interactive Graph Visualizer**: Render live query subgraphs via **Cytoscape.js**.
- **Step-by-Step Traversal Walkthrough**: Animated visual representation of query path hops (e.g. `User → RATED → Movie ← RATED ← Peer User → RATED → Candidate Movie`) with plain English explanations.

### Pillar 2 — Every Recommendation is Explainable (`/recommendations`)
- No canned sentences or free-text hallucinations.
- Every recommended movie returns a structured JSON explanation object containing:
  - `top_genres_matched`: User average rating and count in matching genres.
  - `anchor_movies`: Specific high-rated films that served as the recommendation bridge.
  - `similar_users`: Peer usernames with cosine taste correlation scores.
  - `shared_actors`: Overlapping cast members.
  - `shared_director`: Direct auteur connection.
  - `graph_paths`: Formal Cypher relationship path representation.
  - `score_breakdown`: Detailed breakdown across Collaborative, Content, Graph, and Popularity signals.
- Every claim in the generated explanation is verifiable by Cypher and checked by automated tests.

### Pillar 3 — Prove the ML Works (`/compare`, `/ml-eval`)
- **Compare Users**: Side-by-side comparison of two demo users with divergent taste profiles (e.g. *Alex Vance* [Sci-Fi/Thriller] vs *Elena Rostova* [Romance/Drama]), showing Jaccard divergence and distinct recommendation feeds.
- **Live What-If Simulation**: Rate any film on a 1.0–5.0★ scale, persist the edge immediately to Neo4j via an atomic `MERGE` transaction, and observe real-time candidate re-ranking with a before/after diff (rank shifts, new entries, and dropped candidates).
- **Leakage-Free Evaluation**: Multi-seed (5 repeated hold-outs) evaluation reporting:
  - **Precision@K, Recall@K, NDCG@K**
  - **Rating Prediction RMSE & MAE**
  - Compared against a **Popularity Baseline** and a **Random Baseline**, alongside a full ablation study (Collaborative Only, Content Only, Graph Only, Hybrid).
- **Interactive Weight Sliders**: Sliders dynamically adjusting formula weights with immediate live recalculation.

---

## 📊 Database Schema & Benchmark Counts

### Verified Entity Counts (Live Neo4j)
| Entity Label | Nodes | Constraints / Key Property |
|---|---|---|
| `:Movie` | **30** | `movie_id` (Unique), Index on `title`, `release_year`, `language` |
| `:User` | **15** | `user_id` (Unique), `username` (Unique), `email` (Unique) |
| `:Director` | **15** | `director_id` (Unique), Index on `director_name` |
| `:Actor` | **15** | `actor_id` (Unique), Index on `actor_name` |
| `:Genre` | **15** | `genre_id` (Unique), `genre_name` (Unique) |
| `:Studio` | **15** | `studio_id` (Unique) |
| `:Award` | **15** | `award_id` (Unique) |
| `:Review` | **15** | `review_id` (Unique) |
| **Total Nodes** | **135** | **11 Uniqueness Constraints, 5 B-Tree Indexes** |

### Verified Relationship Counts (Live Neo4j)
| Relationship Type | Count | Relationship Properties & Rules |
|---|---|---|
| `[:RATED]` | **267** | `rating_value` (1.0–5.0), `rating_date` |
| `[:WATCHED]` | **96** | `watch_date`, `completion_percentage` (25–100%) |
| `[:ACTED_IN]` | **90** | Connects actors to movies (~3 actors/movie) |
| `[:HAS_GENRE]` | **84** | Connects movies to genres (1–3 genres/movie) |
| `[:ADDED_TO_WATCHLIST]` | **64** | `added_date` |
| `[:WINS]` | **47** | `year`, `result` ("Won" / "Nominated") |
| `[:PRODUCED_BY]` | **43** | Connects movies to production studios |
| `[:DIRECTED_BY]` | **30** | Exactly 1 director per movie (cardinality enforced) |
| `[:WROTE]` | **15** | Exactly 1 user author per review |
| `[:ABOUT]` | **15** | Exactly 1 target movie per review |
| **Total Relationships** | **651** | **All ER Cardinalities Satisfied** |

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js v18+ & npm**
- **Neo4j 5.x** (Local Neo4j Desktop, Docker, or Neo4j Aura)

### 1. Environment Configuration
Copy the template and verify your credentials:
```bash
cp .env.example .env
```
Ensure `.env` matches your Neo4j instance:
```env
NEO4J_URI=neo4j://127.0.0.1:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password_here
NEO4J_DATABASE=neo4j
```

### 2. Python Virtual Environment Setup
```bash
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
```

### 3. Schema Setup, Seeding & Validation
Run the database initialization pipeline:
```bash
# 1. Create uniqueness constraints and indexes
.\venv\Scripts\python -m backend.db.schema

# 2. Seed deterministic 15-entity benchmark dataset
.\venv\Scripts\python -m backend.seed.seed_data

# 3. Validate ER cardinalities, volume bounds, and constraints
.\venv\Scripts\python -m backend.seed.validate_db
```

### 4. Run Automated Test Suite
```bash
.\venv\Scripts\python -m pytest tests -v
```
All 13 automated tests verify:
- API contracts & endpoints (`/api/health`, `/api/movies`, `/api/recommendations`, `/api/lab/execute`, `/api/recommendations/what-if`).
- Verifiable grounded explanations (asserting zero hallucinated claims).
- Zero data leakage during ML evaluation.
- Cypher query execution without Cartesian duplication.
- Database constraints and cardinality integrity.

---

## 🖥️ Running the Application

### 1. Start the FastAPI Backend
```bash
.\venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Swagger Interactive Docs: `http://127.0.0.1:8000/docs`

### 2. Start the React Frontend
In a new terminal window:
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 📁 Repository Structure
```
cinegraph/
├── docker-compose.yml           # Docker Neo4j 5 Community compose file
├── .env                         # Local environment credentials (git-ignored)
├── .env.example                 # Environment template
├── .gitignore                   # Excludes .env, venv/, node_modules/, dist/
├── requirements.txt             # Python dependencies
├── README.md                    # Project documentation
├── docs/                        # Faculty presentation & academic deliverables
│   ├── technical_architecture.md
│   ├── er_to_graph_mapping.md
│   ├── essential_cypher_queries.md
│   ├── faculty_demo_script.md
│   └── viva_qa_sheet.md
├── backend/                     # FastAPI & ML Core
│   ├── main.py                  # API application and CORS setup
│   ├── config.py                # Pydantic Settings
│   ├── db/
│   │   ├── connection.py        # Official Neo4j Python driver with fallback
│   │   ├── schema.py            # Constraints and indexes DDL
│   │   ├── queries.py           # 12 Essential Cypher queries & Live Lab catalogue
│   │   └── mock_engine.py       # In-memory graph engine fallback
│   ├── seed/
│   │   ├── seed_data.py         # Deterministic benchmark seeder
│   │   └── validate_db.py       # ER cardinality & integrity validator
│   ├── ml/
│   │   ├── collaborative.py     # Mean-centered user CF
│   │   ├── content_based.py     # TF-IDF + structured metadata similarity
│   │   ├── graph_signals.py     # Cypher graph traversal features
│   │   ├── hybrid_engine.py     # Tunable normalized hybrid model
│   │   ├── explainer.py         # Verifiable structured explanations
│   │   └── evaluation.py        # Leakage-free 5-seed evaluation suite
│   ├── routes/                  # API routers (movies, recs, users, lab, graph, etc.)
│   └── schemas/                 # Pydantic models
├── frontend/                    # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/          # Navbar, PosterCard, RatingModal
│   │   ├── pages/               # Home, Recs, LiveLab, CompareUsers, MLEval, etc.
│   │   ├── api/                 # API fetch client
│   │   ├── index.css            # Dark cinematic theme
│   │   └── App.tsx              # React router
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── tests/                       # Pytest test suite
    ├── test_schema_and_constraints.py
    ├── test_queries.py
    ├── test_ml_leakage.py
    ├── test_explanations.py
    └── test_api.py
```
