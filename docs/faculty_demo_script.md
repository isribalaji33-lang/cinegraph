# CineGraph: 5–7 Minute Faculty Presentation Demo Script

This script walks the presenter through each demo phase, ensuring the three non-negotiable pillars are vividly proven within the allotted time.

---

## ⏱️ Timeline Overview
- **0:00 – 1:00**: Project Intro & DBMS Architecture (Central Neo4j, ER Diagram).
- **1:00 – 2:30**: **Pillar 1** — Neo4j Live Lab & Animated Graph Traversal Walkthrough.
- **2:30 – 4:00**: **Pillar 2** — Explainable Recommendations & Grounded Claims.
- **4:00 – 5:30**: **Pillar 3** — User Taste Comparison & Live What-If Rating Simulation.
- **5:30 – 6:30**: **Pillar 3** — Leakage-Free ML Evaluation, Baselines & Ablation Study.
- **6:30 – 7:00**: Q&A, Database Validation & Conclusion.

---

## Phase 1: Introduction & Architecture (Minute 0:00 – 1:00)
1. **Presenter Statement**:
   > *"Good morning respected faculty. Today we present **CineGraph — An Intelligent Movie Recommendation System**. Unlike traditional web applications that use SQL or key-value caches, CineGraph is built with **Neo4j as its primary and central database**. Every movie, actor, director, genre, and user interaction is modeled as a native graph node and directed relationship according to our hand-drawn ER diagram."*
2. **Show Admin Explorer / Database Status**:
   - Open `/admin`.
   - Point out: **Neo4j Live Connected**, 11 Uniqueness Constraints active, 5 B-Tree indexes active.
   - Point out exact benchmark counts: 15 Users, 30 Movies, 15 Directors, 15 Actors, 15 Genres, 267 Ratings, 96 Watches.

---

## Phase 2: Pillar 1 — Neo4j Live Lab (Minute 1:00 – 2:30)
1. **Navigate to "Neo4j Live Lab" (`/lab`)**:
   > *"In Pillar 1, Neo4j is the star. We allow the presenter to run live Cypher queries and watch graph traversal happen in real time."*
2. **Select Curated Query**: `"2-Hop Collaborative Taste Traversal"`.
   - Show the parameterized Cypher query on screen.
   - Click **Run Query**.
   - Show the real measured execution time (e.g. `12.4 ms`) and `PROFILE` plan showing `NodeIndexSeek` and `Expand(All)` with real db hits.
3. **Show Traversal Walkthrough**:
   - Highlight the animated step-by-step path:
     `User(alex_vance) → [:RATED 5★] → Movie(Inception) ← [:RATED 5★] ← Peer(sarah_miller) → [:RATED 5★] → Candidate(The Martian)`.
   - Switch to the interactive **Cytoscape.js Graph View** and show the visual clusters.

---

## Phase 3: Pillar 2 — Explainable Recommendations (Minute 2:30 – 4:00)
1. **Navigate to "Recommendations" (`/recommendations`)**:
   - Select demo user **`alex_vance` (u01)**.
2. **Examine Top Recommendation (e.g., *Blade Runner 2049* or *The Martian*)**:
   > *"Pillar 2 guarantees explainability from real signals, not canned text. Notice the structured explanation generated for this film:"*
3. **Read Explanation aloud**:
   > *"Recommended because you rate Sci-Fi highly (avg 4.6★ across 5 movies), you rated 'Inception' and 'Interstellar' 5★ and this movie shares key creative DNA with them, it shares director Denis Villeneuve from your top-rated films, and 2 users with matching taste rated it highly."*
4. **Show Score Breakdown**:
   - Show the 4 signal bars: Collaborative: `0.38`, Content: `0.28`, Graph: `0.19`, Popularity: `0.08` $\rightarrow$ Hybrid: `0.93`.

---

## Phase 4: Pillar 3 — Compare Users & What-If Simulation (Minute 4:00 – 5:30)
1. **Navigate to "Compare Users & What-If" (`/compare`)**:
   - Show **User 1: Alex Vance (Sci-Fi / Thriller Fan)** on the left vs **User 2: Elena Rostova (Romance / Drama Lover)** on the right.
   - Point out: Alex gets *Blade Runner 2049*, *Arrival*, *The Martian*; Elena gets *Casablanca*, *La La Land*, *Little Women*.
   - Point out Jaccard taste divergence metric (`0.85`), proving clean cluster separation.
2. **Execute Live What-If Simulation**:
   - Select movie **"Saving Private Ryan" (War/Action)**.
   - Move rating slider to **5.0★** and click **Simulate Live Rating**.
   - Show that the rating is immediately persisted to Neo4j.
   - Show the **Before/After diff table**:
     - *Inglourious Basterds* moves up from Rank 8 to Rank 2!
     - *Fury Road* enters top 5 due to shared action/actor edges!
     - The summary shows real rank adjustments in milliseconds.

---

## Phase 5: Pillar 3 — Leakage-Free ML Evaluation (Minute 5:30 – 6:30)
1. **Navigate to "ML Evaluation" (`/ml-eval`)**:
   > *"We evaluate our recommendation engine across 5 repeated hold-out splits with fixed seeds. We enforce zero data leakage: test ratings are strictly isolated and never seen by the recommender."*
2. **Show Metrics Table & Bar Charts**:
   - Precision@5: `0.183` vs Popularity `0.114` vs Random `0.129`.
   - Recall@5: `0.454` vs Popularity `0.288` vs Random `0.290`.
   - RMSE: `0.916` vs Random `1.450`.
   - Show the ablation study (Collab only, Content only, Graph only, Hybrid).
3. **Move Live Weight Sliders**:
   - Adjust Collaborative weight to 70%, Graph to 20%, Popularity to 10% and see live formula re-computation.

---

## Phase 6: Conclusion & Viva Readiness (Minute 6:30 – 7:00)
- Conclude by offering faculty to test any arbitrary node in the Graph Explorer (`/explore`) or run custom Cypher in the Live Lab (`/lab`).
- Thank the committee.
