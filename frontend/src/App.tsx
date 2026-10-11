import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
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
  const [currentUser, setCurrentUser] = useState<string>('u01');

  return (
    <Router>
      <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col font-sans">
        <Navbar currentUser={currentUser} onUserChange={setCurrentUser} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Routes>
            <Route path="/" element={<Home currentUser={currentUser} />} />
            <Route path="/recommendations" element={<Recommendations currentUser={currentUser} />} />
            <Route path="/lab" element={<LiveLab />} />
            <Route path="/compare" element={<CompareUsers />} />
            <Route path="/ml-eval" element={<MLEvaluation />} />
            <Route path="/explore" element={<GraphExplorer />} />
            <Route path="/movies/:id" element={<MovieDetails currentUser={currentUser} />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin" element={<AdminExplorer />} />
            <Route path="/profile" element={<Profile currentUser={currentUser} />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-cine-border/50 py-6 text-center text-xs text-slate-500 font-mono">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>CineGraph © 2026 — An Intelligent Movie Recommendation System with Neo4j & ML</span>
            <span className="text-slate-400">DBMS Academic Project • Primary Database: Neo4j 5.x Bolt</span>
          </div>
        </footer>
      </div>
    </Router>
  );
};
