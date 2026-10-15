import React, { useEffect, useState } from 'react';
import { Film, Zap, Network, Check } from 'lucide-react';
import { fetchJson } from '../api/client';
import { playTaDumSound } from '../utils/audio';

interface ProfileSelectProps {
  onSelect: (userId: string) => void;
}

// Muted, cinematic dark metallic palettes with subtle rim illumination
const PROFILE_PALETTES = [
  { bg: 'from-[#1e1b24] via-[#16131c] to-[#0f0d14]', border: 'border-rose-500/20', text: 'text-rose-200', glow: 'rgba(241,11,32,0.12)' },
  { bg: 'from-[#161c28] via-[#111620] to-[#0c0f16]', border: 'border-blue-500/20', text: 'text-blue-200', glow: 'rgba(1,139,255,0.12)' },
  { bg: 'from-[#14201c] via-[#0f1714] to-[#0a100e]', border: 'border-emerald-500/20', text: 'text-emerald-200', glow: 'rgba(16,185,129,0.12)' },
  { bg: 'from-[#221c16] via-[#181410] to-[#100d0a]', border: 'border-amber-500/20', text: 'text-amber-200', glow: 'rgba(245,158,11,0.12)' },
  { bg: 'from-[#1b1928] via-[#13121d] to-[#0d0c14]', border: 'border-indigo-500/20', text: 'text-indigo-200', glow: 'rgba(99,102,241,0.12)' },
  { bg: 'from-[#241720] via-[#1a1117] to-[#120b10]', border: 'border-pink-500/20', text: 'text-pink-200', glow: 'rgba(236,72,153,0.12)' },
  { bg: 'from-[#142220] via-[#0e1716] to-[#09100f]', border: 'border-teal-500/20', text: 'text-teal-200', glow: 'rgba(20,184,166,0.12)' },
  { bg: 'from-[#241a16] via-[#1a120f] to-[#120c0a]', border: 'border-orange-500/20', text: 'text-orange-200', glow: 'rgba(249,115,22,0.12)' },
  { bg: 'from-[#141e26] via-[#0e151b] to-[#0a0f13]', border: 'border-cyan-500/20', text: 'text-cyan-200', glow: 'rgba(6,182,212,0.12)' },
  { bg: 'from-[#201826] via-[#16101c] to-[#0f0b13]', border: 'border-purple-500/20', text: 'text-purple-200', glow: 'rgba(168,85,247,0.12)' },
  { bg: 'from-[#1c1a24] via-[#14121a] to-[#0e0c12]', border: 'border-violet-500/20', text: 'text-violet-200', glow: 'rgba(139,92,246,0.12)' },
  { bg: 'from-[#1e2016] via-[#15170f] to-[#0e100a]', border: 'border-lime-500/20', text: 'text-lime-200', glow: 'rgba(132,204,22,0.12)' },
  { bg: 'from-[#161e28] via-[#10151c] to-[#0b0e14]', border: 'border-sky-500/20', text: 'text-sky-200', glow: 'rgba(14,165,233,0.12)' },
  { bg: 'from-[#22161a] via-[#180f12] to-[#100a0d]', border: 'border-rose-500/20', text: 'text-rose-200', glow: 'rgba(244,63,94,0.12)' },
  { bg: 'from-[#201624] via-[#160f1a] to-[#0f0a12]', border: 'border-fuchsia-500/20', text: 'text-fuchsia-200', glow: 'rgba(217,70,239,0.12)' },
];

const FALLBACK_USERS = [
  { user_id: 'u01', username: 'alex_vance', country: 'USA', is_cold_start: false, age: 32 },
  { user_id: 'u02', username: 'elena_rostova', country: 'Canada', is_cold_start: false, age: 29 },
  { user_id: 'u03', username: 'marcus_chen', country: 'UK', is_cold_start: false, age: 38 },
  { user_id: 'u04', username: 'sarah_miller', country: 'Germany', is_cold_start: false, age: 34 },
  { user_id: 'u05', username: 'kenji_sato', country: 'Japan', is_cold_start: false, age: 30 },
  { user_id: 'u06', username: 'priya_sharma', country: 'India', is_cold_start: false, age: 31 },
  { user_id: 'u07', username: 'lucas_silva', country: 'Brazil', is_cold_start: false, age: 35 },
  { user_id: 'u08', username: 'amira_hassan', country: 'Egypt', is_cold_start: false, age: 33 },
  { user_id: 'u09', username: 'david_kim', country: 'South Korea', is_cold_start: false, age: 37 },
  { user_id: 'u10', username: 'clara_dupont', country: 'France', is_cold_start: false, age: 28 },
  { user_id: 'u11', username: 'mateo_garcia', country: 'Spain', is_cold_start: false, age: 36 },
  { user_id: 'u12', username: 'olivia_smith', country: 'Australia', is_cold_start: false, age: 29 },
  { user_id: 'u13', username: 'liam_obrien', country: 'Ireland', is_cold_start: false, age: 39 },
  { user_id: 'u14', username: 'fatima_almansoori', country: 'UAE', is_cold_start: false, age: 31 },
  { user_id: 'u15', username: 'chloe_rivera', country: 'USA', is_cold_start: true, age: 25 },
];

function formatDisplayName(username: string): string {
  if (!username) return 'Viewer';
  return username
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function calculateAge(dobStr?: string): number {
  if (!dobStr) return 30;
  try {
    const born = new Date(dobStr);
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    const m = now.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < born.getDate())) {
      age--;
    }
    return age > 0 ? age : 30;
  } catch {
    return 30;
  }
}

export const ProfileSelect: React.FC<ProfileSelectProps> = ({ onSelect }) => {
  const [users, setUsers] = useState<any[]>(FALLBACK_USERS);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [dbLive, setDbLive] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Verify actual live database connectivity status
    fetchJson<any>('/health')
      .then((health) => {
        if (isMounted) {
          const isConnected = Boolean(health?.database?.connected || health?.database?.mode === 'neo4j_live');
          setDbLive(isConnected);
        }
      })
      .catch(() => {
        if (isMounted) setDbLive(false);
      });

    // Fetch dynamic profile records from live database
    fetchJson<any[]>('/users')
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setUsers(data);
        }
      })
      .catch((err) => {
        console.warn('Backend loading, using ready profile records:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelect = (userId: string) => {
    if (isSelecting) return; // Prevent double submissions
    setIsSelecting(true);
    setSelected(userId);
    // Play the iconic Netflix Ta-dum sound strictly on user selection (never on hover)
    playTaDumSound();
    setTimeout(() => {
      onSelect(userId);
    }, 550);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between py-6 sm:py-10 px-4 sm:px-6 relative overflow-x-hidden overflow-y-auto selection:bg-[#F10B20]/30"
      style={{ backgroundColor: '#07070A' }}
    >
      {/* ── Cinematic Ambient Background & Subtle Graph Illumination ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft, restrained red ambient lighting */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-60 blur-[140px]"
          style={{
            background: 'radial-gradient(circle at center, rgba(241,11,32,0.08) 0%, transparent 65%)',
            top: '-15%',
            left: '-10%',
          }}
        />

        {/* Soft, restrained blue ambient lighting */}
        <div
          className="absolute w-[550px] h-[550px] rounded-full opacity-50 blur-[130px]"
          style={{
            background: 'radial-gradient(circle at center, rgba(1,139,255,0.06) 0%, transparent 65%)',
            bottom: '-10%',
            right: '-8%',
          }}
        />

        {/* Subtle, non-distracting Neo4j graph lines hint */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.045]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="12%" y1="18%" x2="38%" y2="26%" stroke="white" strokeWidth="1" strokeDasharray="3 6" />
          <line x1="38%" y1="26%" x2="68%" y2="20%" stroke="white" strokeWidth="1" strokeDasharray="3 6" />
          <line x1="68%" y1="20%" x2="88%" y2="40%" stroke="white" strokeWidth="1" strokeDasharray="3 6" />
          <line x1="88%" y1="40%" x2="62%" y2="68%" stroke="white" strokeWidth="1" strokeDasharray="3 6" />
          <line x1="62%" y1="68%" x2="28%" y2="62%" stroke="white" strokeWidth="1" strokeDasharray="3 6" />
          <line x1="28%" y1="62%" x2="12%" y2="18%" stroke="white" strokeWidth="1" strokeDasharray="3 6" />
          <line x1="38%" y1="26%" x2="62%" y2="68%" stroke="white" strokeWidth="1" strokeDasharray="3 6" />
          <circle cx="12%" cy="18%" r="3" fill="#F10B20" />
          <circle cx="38%" cy="26%" r="3.5" fill="#018BFF" />
          <circle cx="68%" cy="20%" r="3" fill="#F10B20" />
          <circle cx="88%" cy="40%" r="3" fill="#018BFF" />
          <circle cx="62%" cy="68%" r="3.5" fill="#F10B20" />
          <circle cx="28%" cy="62%" r="3" fill="#018BFF" />
        </svg>
      </div>

      {/* ── Main Content Container ── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center my-auto py-2">
        {/* ── Header: Brand Logo & Status Badges ── */}
        <header className="flex flex-col items-center gap-2 mb-4 sm:mb-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F10B20] flex items-center justify-center shadow-lg shadow-red-950/60 ring-1 ring-red-500/30">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
              Cine<span className="text-[#F10B20]">Graph</span>
            </span>
          </div>

          {/* Clean, restrained status badges */}
          <div className="flex items-center gap-2 mt-0.5">
            {dbLive === null ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold bg-zinc-900/80 text-zinc-400 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-ping" />
                NEO4J CONNECTING
              </span>
            ) : dbLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                NEO4J LIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold bg-red-500/10 text-red-400 border border-red-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                NEO4J OFFLINE
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold bg-blue-500/10 text-sky-400 border border-blue-500/25">
              <Zap className="w-3 h-3 text-sky-400" />
              ML ENGINE
            </span>
          </div>
        </header>

        {/* ── Heading & Understated Subtitle ── */}
        <div className="text-center mb-6 sm:mb-8 max-w-lg px-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading text-white tracking-tight">
            Who's watching?
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] font-normal mt-1.5 leading-relaxed">
            Choose your profile to discover your next favourite film.
          </p>
        </div>

        {/* ── 15 Profiles Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 w-full max-w-4xl mx-auto px-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shimmer" />
                <div className="w-16 h-3 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-7 w-full max-w-4xl lg:max-w-5xl mx-auto px-2"
            role="list"
            aria-label="Profile selection list"
          >
            {users.map((user, idx) => {
              const palette = PROFILE_PALETTES[idx % PROFILE_PALETTES.length];
              const isSelected = selected === user.user_id;
              const displayName = formatDisplayName(user.username);
              const initial = (user.username?.[0] || 'U').toUpperCase();
              const userAge = user.age || calculateAge(user.user_dob);

              return (
                <button
                  key={user.user_id}
                  onClick={() => handleSelect(user.user_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(user.user_id);
                    }
                  }}
                  disabled={isSelecting && !isSelected}
                  role="listitem"
                  aria-label={`Select profile ${displayName}`}
                  tabIndex={0}
                  className="group flex flex-col items-center focus:outline-none cursor-pointer select-none transition-all duration-200"
                >
                  {/* Avatar Tile (100–120px desktop, rounded-2xl, subtle borders) */}
                  <div
                    className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden transition-all duration-200 ease-out border motion-reduce:transform-none motion-reduce:transition-none flex items-center justify-center ${
                      isSelected
                        ? 'border-[#F10B20] ring-2 ring-[#F10B20] scale-95 shadow-[0_0_35px_rgba(241,11,32,0.6)]'
                        : 'border-white/[0.08] group-hover:border-[#F10B20] group-hover:shadow-[0_0_24px_rgba(241,11,32,0.35)] group-hover:-translate-y-1.5 group-hover:scale-[1.03] group-focus-visible:border-[#F10B20] group-focus-visible:ring-2 group-focus-visible:ring-[#F10B20]'
                    }`}
                    style={{
                      background: '#111116',
                    }}
                  >
                    {/* Dark gradient surface */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${palette.bg}`} />

                    {/* Subtle internal radial illumination */}
                    <div
                      className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-200"
                      style={{
                        background: `radial-gradient(circle at 50% 40%, ${palette.glow} 0%, transparent 75%)`,
                      }}
                    />

                    {/* Subtle border highlight line */}
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.06] rounded-2xl pointer-events-none" />

                    {/* Typographic Monogram Initial */}
                    <span
                      className={`relative z-10 text-3xl sm:text-4xl font-black font-heading tracking-wider select-none transition-transform duration-200 group-hover:scale-110 ${palette.text}`}
                      style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}
                    >
                      {initial}
                    </span>

                    {/* Cold start indicator pill */}
                    {user.is_cold_start && (
                      <span className="absolute top-2 right-2 text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm z-20">
                        NEW
                      </span>
                    )}

                    {/* Selected state check overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#F10B20]/30 backdrop-blur-[2px] flex items-center justify-center z-30 animate-pulse">
                        <Check className="w-8 h-8 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>

                  {/* Profile Metadata (Aligned, truncated gracefully) */}
                  <div className="text-center w-full max-w-[120px] mt-2.5">
                    <p
                      className={`text-xs sm:text-sm font-semibold truncate transition-colors duration-200 ${
                        isSelected
                          ? 'text-[#F10B20]'
                          : 'text-zinc-200 group-hover:text-white'
                      }`}
                      title={displayName}
                    >
                      {displayName}
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors duration-200 truncate mt-0.5">
                      {user.country} · {userAge}y
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer Branding & System Info ── */}
      <footer className="relative z-10 mt-6 sm:mt-8 text-center text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-mono">
        <span>CineGraph © 2026 — DBMS Academic Project</span>
        <span className="hidden sm:inline w-1 h-1 rounded-full bg-zinc-700" />
        <span>Neo4j 5.x Graph Engine</span>
        <span className="hidden sm:inline w-1 h-1 rounded-full bg-zinc-700" />
        <span>Multi-Signal ML Pipeline</span>
      </footer>
    </div>
  );
};

