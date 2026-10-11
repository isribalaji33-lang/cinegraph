import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProfileSelect } from './pages/ProfileSelect';
import { Home } from './pages/Home';
import { Recommendations } from './pages/Recommendations';
import { LiveLab } from './pages/LiveLab';
import { CompareUsers } from './pages/CompareUsers';
import { MLEvaluation } from './pages/MLEvaluation';
import { GraphExplorer } from './pages/GraphExplorer';
import { MovieDetails } from './pages/MovieDetails';
import { Analytics } from './pages/Analytics';
import { AdminExplorer } from './pages/AdminExplorer';
import { Profile } from './pages/Profile';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // ── Netflix-style profile gate ──────────────────────────
  if (!currentUser) {
    return (
      <ProfileSelect
        onSelect={(userId) => setCurrentUser(userId)}
      />
    );
  }

  // ── Main app shell ──────────────────────────────────────
  return (
    <Router>
      <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#f5f5f1' }}>
        <Navbar
          currentUser={currentUser}
          onUserChange={setCurrentUser}
          onSwitchProfile={() => setCurrentUser(null)}
        />

        <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6">
          <Routes>
            <Route path="/"                element={<Home currentUser={currentUser} />} />
            <Route path="/recommendations" element={<Recommendations currentUser={currentUser} />} />
            <Route path="/lab"             element={<LiveLab />} />
            <Route path="/compare"         element={<CompareUsers />} />
            <Route path="/ml-eval"         element={<MLEvaluation />} />
            <Route path="/explore"         element={<GraphExplorer />} />
            <Route path="/movies/:id"      element={<MovieDetails currentUser={currentUser} />} />
            <Route path="/analytics"       element={<Analytics />} />
            <Route path="/admin"           element={<AdminExplorer />} />
            <Route path="/profile"         element={<Profile currentUser={currentUser} />} />
          </Routes>
        </main>

        <footer className="mt-16 border-t border-white/5">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#e50914] flex items-center justify-center text-white text-xs font-bold">C</div>
              <span className="text-sm text-[#5a5a6e]">
                <span className="text-white font-semibold">CineGraph</span> © 2026 — Neo4j-Powered Movie Recommendation System
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#5a5a6e] font-mono">
              <span>DBMS Academic Project</span>
              <span className="w-1 h-1 rounded-full bg-[#5a5a6e]" />
              <span>Neo4j 5.x Bolt</span>
              <span className="w-1 h-1 rounded-full bg-[#5a5a6e]" />
              <span>FastAPI + Vite React</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};
