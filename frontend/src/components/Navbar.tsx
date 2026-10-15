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
  { name: 'Neo4j Live Lab',  path: '/lab',          icon: Network,   badge: 'P1' },
  { name: 'Compare & What-If', path: '/compare',   icon: Scale,     badge: 'P3' },
  { name: 'ML Evaluation',   path: '/ml-eval',      icon: Activity,  badge: 'ML' },
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

    const checkHealth = () => {
      fetchJson<any>('/health')
        .then(d => {
          if (d && d.database) {
            setDbStatus(d.database);
          }
        })
        .catch(() => {
          setDbStatus({ connected: false });
        });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#08080C]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl'
            : 'bg-gradient-to-b from-[#08080C] via-[#08080C]/80 to-transparent'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

          {/* ── Brand ── */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#F10B20] flex items-center justify-center shadow-md shadow-red-900/40 group-hover:scale-105 transition-transform">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <span className="text-base font-bold font-heading text-white tracking-tight">
                Cine<span style={{ color: '#F10B20' }}>Graph</span>
              </span>
              <span className="block text-[8px] text-[#64748B] font-mono uppercase tracking-widest mt-0.5">
                Neo4j · ML Engine
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center px-1">
            {NAV_LINKS.map(link => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                    active
                      ? 'text-white bg-white/[0.06] font-semibold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-[#F10B20] after:rounded-full'
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold uppercase ${
                      active
                        ? 'bg-[#F10B20]/20 text-[#F10B20] border border-[#F10B20]/30'
                        : 'bg-white/[0.06] text-[#94A3B8] border border-white/[0.06]'
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Right Controls ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Neo4j Status */}
            <Link
              to="/admin"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all duration-200 flex-shrink-0 ${
                dbStatus?.connected
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:border-emerald-400/60'
                  : 'bg-red-950/30 border-red-500/30 text-red-300'
              }`}
              title={dbStatus?.connected ? 'Neo4j Bolt Driver Live' : 'Database Disconnected'}
            >
              <span className="relative flex h-1.5 w-1.5">
                {dbStatus?.connected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dbStatus?.connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
              </span>
              <span className="font-medium tracking-wide">{dbStatus?.connected ? 'Neo4j Live' : 'Offline'}</span>
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
      <div className="h-14" />
    </>
  );
};
