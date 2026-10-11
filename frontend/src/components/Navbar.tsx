import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Network, Sparkles, Scale, Activity, BarChart3, Database, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { fetchJson } from '../api/client';

interface NavbarProps {
  currentUser: string;
  onUserChange: (userId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onUserChange }) => {
  const location = useLocation();
  const [users, setUsers] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    fetchJson<any[]>('/users').then(setUsers).catch(console.error);
    fetchJson<any>('/health').then(data => setDbStatus(data.database)).catch(console.error);
  }, []);

  const navLinks = [
    { name: 'Discover', path: '/', icon: Film },
    { name: 'Recommendations', path: '/recommendations', icon: Sparkles },
    { name: 'Live Lab', path: '/lab', icon: Network, badge: 'Pillar 1' },
    { name: 'Compare & What-If', path: '/compare', icon: Scale, badge: 'Pillar 3' },
    { name: 'ML Eval', path: '/ml-eval', icon: Activity, badge: 'Pillar 3' },
    { name: 'Explore Graph', path: '/explore', icon: Network },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Admin', path: '/admin', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-cine-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-900/40 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold font-heading tracking-tight text-white flex items-center gap-1.5">
              Cine<span className="text-rose-500">Graph</span>
            </span>
            <span className="hidden sm:block text-[10px] text-slate-400 -mt-1 font-mono">NEO4J + ML ENGINE</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white bg-white/10 font-semibold shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>{link.name}</span>
                {link.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-semibold ${
                    link.badge === 'Pillar 1'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Neo4j Status Badge */}
          <Link
            to="/admin"
            title={dbStatus?.details || 'Database status'}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              dbStatus?.connected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
            }`}
          >
            {dbStatus?.connected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Neo4j Live</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Fallback Mode</span>
              </>
            )}
          </Link>

          {/* User selector */}
          <div className="flex items-center gap-2 bg-cine-card border border-cine-border rounded-xl px-2.5 py-1.5">
            <User className="w-4 h-4 text-slate-400" />
            <select
              value={currentUser}
              onChange={(e) => onUserChange(e.target.value)}
              className="bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id} className="bg-cine-card text-slate-200">
                  {u.username} {u.is_cold_start ? '(Cold Start ★)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Profile Link */}
          <Link
            to="/profile"
            className="p-2 rounded-xl bg-cine-card border border-cine-border hover:bg-cine-hover text-slate-300 hover:text-white transition-colors"
            title="My Profile"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
