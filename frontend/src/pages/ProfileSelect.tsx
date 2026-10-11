import React, { useEffect, useState } from 'react';
import { Film, ChevronRight, Zap, Network } from 'lucide-react';
import { fetchJson } from '../api/client';

interface ProfileSelectProps {
  onSelect: (userId: string) => void;
}

// Curated gradient palettes per user slot
const AVATAR_GRADIENTS = [
  'from-rose-600 to-amber-500',
  'from-violet-600 to-blue-500',
  'from-emerald-600 to-cyan-500',
  'from-orange-600 to-rose-500',
  'from-blue-600 to-indigo-500',
  'from-pink-600 to-purple-500',
  'from-teal-600 to-emerald-500',
  'from-amber-600 to-yellow-500',
  'from-red-600 to-pink-500',
  'from-cyan-600 to-blue-500',
  'from-purple-600 to-pink-500',
  'from-green-600 to-teal-500',
  'from-indigo-600 to-violet-500',
  'from-yellow-600 to-orange-500',
  'from-fuchsia-600 to-rose-500',
];

const COUNTRY_FLAGS: Record<string, string> = {
  'USA': '🇺🇸', 'UK': '🇬🇧', 'Russia': '🇷🇺', 'Japan': '🇯🇵',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Brazil': '🇧🇷', 'India': '🇮🇳',
  'Australia': '🇦🇺', 'Canada': '🇨🇦', 'South Korea': '🇰🇷',
  'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Mexico': '🇲🇽', 'Argentina': '🇦🇷',
};

export const ProfileSelect: React.FC<ProfileSelectProps> = ({ onSelect }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<any[]>('/users')
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (userId: string) => {
    setSelected(userId);
    setTimeout(() => onSelect(userId), 420);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#050507' }}
    >
      {/* ── Animated ambient orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-3xl animate-float"
             style={{ background: 'radial-gradient(#e50914, transparent)', top: '-20%', left: '-10%' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-8 blur-3xl"
             style={{ background: 'radial-gradient(#018bff, transparent)', bottom: '-10%', right: '-5%',
                      animation: 'float 6s ease-in-out infinite reverse' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full opacity-6 blur-2xl"
             style={{ background: 'radial-gradient(#f5c518, transparent)', top: '40%', left: '60%',
                      animation: 'float 5s ease-in-out infinite', animationDelay: '1s' }} />
      </div>

      {/* ── Logo ── */}
      <div className="mb-10 flex flex-col items-center gap-3 fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#e50914] flex items-center justify-center shadow-lg shadow-red-900/60">
            <Film className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-black font-heading text-white tracking-tight">
            Cine<span style={{ color: '#e50914' }}>Graph</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-red"><Network className="w-3 h-3" /> Neo4j Live</span>
          <span className="badge badge-blue"><Zap className="w-3 h-3" /> ML Engine</span>
        </div>
      </div>

      {/* ── Who's watching? ── */}
      <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white mb-10 fade-in"
          style={{ animationDelay: '0.1s' }}>
        Who's watching?
      </h1>

      {/* ── Profile Grid ── */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl shimmer" />
              <div className="w-16 h-3 rounded shimmer" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid gap-4 sm:gap-5 px-4 fade-in"
          style={{
            gridTemplateColumns: `repeat(${Math.min(users.length, 5)}, minmax(0, 1fr))`,
            animationDelay: '0.2s',
            maxWidth: 720,
          }}
        >
          {users.map((user, idx) => {
            const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
            const flag = COUNTRY_FLAGS[user.country] || '🌍';
            const isSelected = selected === user.user_id;

            return (
              <button
                key={user.user_id}
                onClick={() => handleClick(user.user_id)}
                className="group flex flex-col items-center gap-3 focus:outline-none"
              >
                {/* Avatar */}
                <div
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden transition-all duration-300 ${
                    isSelected
                      ? 'scale-95 ring-4 ring-[#e50914] ring-offset-4 ring-offset-[#050507]'
                      : 'group-hover:scale-105 group-hover:ring-2 ring-white/30 ring-offset-2 ring-offset-[#050507]'
                  }`}
                  style={{
                    boxShadow: isSelected
                      ? '0 0 32px rgba(229,9,20,0.6)'
                      : '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Gradient fill */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

                  {/* Pattern overlay */}
                  <div className="absolute inset-0 opacity-20"
                       style={{
                         backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                       }} />

                  {/* Initial letter */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl font-black font-heading text-white/90 select-none"
                          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                      {user.username?.[0]?.toUpperCase()}
                    </span>
                  </div>

                  {/* Country flag */}
                  <span className="absolute top-2 right-2 text-lg leading-none">{flag}</span>

                  {/* Cold start badge */}
                  {user.is_cold_start && (
                    <span className="absolute bottom-2 left-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/80 text-black">
                      NEW
                    </span>
                  )}

                  {/* Selected overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#e50914]/20 flex items-center justify-center">
                      <ChevronRight className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="text-center">
                  <p className={`text-sm font-semibold transition-colors duration-200 ${
                    isSelected ? 'text-[#e50914]' : 'text-[#a3a3b3] group-hover:text-white'
                  }`}>
                    {user.username}
                  </p>
                  <p className="text-[10px] text-[#5a5a6e] mt-0.5">
                    {user.country} · Age {user.age}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Footer hint ── */}
      <p className="mt-12 text-sm text-[#5a5a6e] fade-in" style={{ animationDelay: '0.3s' }}>
        Select a profile to personalize your recommendations
      </p>

      {/* ── Bottom branding ── */}
      <div className="absolute bottom-6 text-[11px] text-[#2a2a3a] font-mono">
        CineGraph © 2026 — DBMS Academic Project · Neo4j 5.x
      </div>
    </div>
  );
};
