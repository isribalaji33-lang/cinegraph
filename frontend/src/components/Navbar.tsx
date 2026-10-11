import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Film, Network, Sparkles, Scale, Activity, BarChart3,
  Database, User, Users, ChevronDown, Search, Menu, X, Zap,
} from 'lucide-react';
import { fetchJson } from '../api/client';

interface NavbarProps {
  currentUser: string;
  onUserChange: (userId: string) => void;
  onSwitchProfile?: () => void;
}

const NAV_LINKS = [
  { name: 'Discover',        path: '/',            icon: Film },
  { name: 'For You',         path: '/recommendations', icon: Sparkles },
  { name: 'Neo4j Live Lab',  path: '/lab',          icon: Network,   badge: 'Pillar 1' },
  { name: 'Compare & What-If', path: '/compare',   icon: Scale,     badge: 'Pillar 3' },
  { name: 'ML Evaluation',   path: '/ml-eval',      icon: Activity,  badge: 'Pillar 3' },
  { name: 'Graph Explorer',  path: '/explore',      icon: Network },
  { name: 'Analytics',       path: '/analytics',    icon: BarChart3 },
  { name: 'Admin',           path: '/admin',        icon: Database },
];

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onUserChange, onSwitchProfile }) => {
  const location = useLocation();
  const [users, setUsers] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchJson<any[]>('/users').then(setUsers).catch(console.error);
    fetchJson<any>('/health').then(d => setDbStatus(d.database)).catch(console.error);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentUserObj = users.find(u => u.user_id === currentUser);
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl'
            : 'bg-gradient-to-b from-[#0a0a0f] to-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* ── Brand ── */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative w-9 h-9">
              <div className="w-9 h-9 rounded-lg bg-[#e50914] flex items-center justify-center shadow-lg shadow-red-900/60 group-hover:shadow-red-600/60 transition-shadow">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0a0f] animate-pulse" />
            </div>
            <div className="leading-none">
              <span className="text-lg font-bold font-heading text-white tracking-tight">
                Cine<span style={{ color: '#e50914' }}>Graph</span>
              </span>
              <span className="block text-[9px] text-[#5a5a6e] font-mono uppercase tracking-widest mt-0.5">
                Neo4j · ML Engine
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden xl:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_LINKS.map(link => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                    active
                      ? 'text-white'
                      : 'text-[#a3a3b3] hover:text-white'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 bg-white/6 rounded-lg" />
                  )}
                  <span className="relative">{link.name}</span>
                  {link.badge && (
                    <span className={`relative text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                      link.badge === 'Pillar 1'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Right Controls ── */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Neo4j Status */}
            <Link
              to="/admin"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-mono border transition-all flex-shrink-0 ${
                dbStatus?.connected
                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400 hover:border-emerald-400/60'
                  : 'bg-red-950/50 border-red-500/30 text-red-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span>{dbStatus?.connected ? 'Neo4j Live' : 'Offline'}</span>
            </Link>

            {/* User Selector */}
            <div className="relative flex-shrink-0" ref={dropRef}>
              <button
                onClick={() => setUserDropdown(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 hover:border-white/15 transition-all text-sm flex-shrink-0"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#e50914] to-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {currentUserObj?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-white font-medium whitespace-nowrap">
                  {currentUserObj?.username || currentUser}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#a3a3b3] transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
              </button>

              {userDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#111118] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs text-[#5a5a6e] font-mono uppercase tracking-wider">Switch Profile</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {users.map(u => (
                      <button
                        key={u.user_id}
                        onClick={() => { onUserChange(u.user_id); setUserDropdown(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-white/5 transition-colors ${
                          u.user_id === currentUser ? 'text-white bg-white/4' : 'text-[#a3a3b3]'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.username}</p>
                          <p className="text-xs text-[#5a5a6e]">{u.country}</p>
                        </div>
                        {u.is_cold_start && (
                          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono flex-shrink-0">
                            COLD
                          </span>
                        )}
                        {u.user_id === currentUser && (
                          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/5 p-1 space-y-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#a3a3b3] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </Link>
                    {onSwitchProfile && (
                      <button
                        onClick={() => {
                          setUserDropdown(false);
                          onSwitchProfile();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#a3a3b3] hover:text-[#e50914] hover:bg-white/5 transition-colors text-left"
                      >
                        <Users className="w-4 h-4" />
                        Who's watching?
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/8 text-white"
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/5 bg-[#0a0a0f]/98 backdrop-blur-xl">
            <nav className="px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map(link => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-white/8 text-white'
                        : 'text-[#a3a3b3] hover:text-white hover:bg-white/4'
                    }`}
                  >
                    <link.icon className={`w-4 h-4 ${active ? 'text-[#e50914]' : 'text-[#5a5a6e]'}`} />
                    {link.name}
                    {link.badge && (
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Spacer to push content below fixed navbar */}
      <div className="h-16" />
    </>
  );
};
