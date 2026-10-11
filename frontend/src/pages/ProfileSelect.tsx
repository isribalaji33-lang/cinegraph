import React, { useEffect, useState } from 'react';
import { Film, ChevronRight, Zap, Network } from 'lucide-react';
import { fetchJson } from '../api/client';
import { playTaDumSound } from '../utils/audio';

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
    // Play the iconic Netflix Ta-dum sound automatically on profile selection
    playTaDumSound();
    setTimeout(() => onSelect(userId), 650);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start sm:justify-center py-6 sm:py-10 px-4 overflow-y-auto"
      style={{ background: '#050507' }}
    >
      {/* ── Animated ambient orbs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-10 blur-3xl animate-float"
             style={{ background: 'radial-gradient(#e50914, transparent)', top: '-20%', left: '-10%' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-8 blur-3xl"
             style={{ background: 'radial-gradient(#018bff, transparent)', bottom: '-10%', right: '-5%',
                      animation: 'float 6s ease-in-out infinite reverse' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full opacity-6 blur-2xl"
             style={{ background: 'radial-gradient(#f5c518, transparent)', top: '40%', left: '60%',
                      animation: 'float 5s ease-in-out infinite', animationDelay: '1s' }} />
      </div>

      {/* ── CineGraph Title Card ── */}
      <div className="mb-4 sm:mb-6 flex flex-col items-center gap-2.5 z-10 fade-in pt-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#e50914] flex items-center justify-center shadow-lg shadow-red-900/60 ring-1 ring-red-500/40">
            <Film className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <span className="text-3xl sm:text-4xl font-black font-heading text-white tracking-tight">
            Cine<span style={{ color: '#e50914' }}>Graph</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-red"><Network className="w-3 h-3" /> Neo4j Live</span>
          <span className="badge badge-blue"><Zap className="w-3 h-3" /> ML Engine</span>
        </div>
      </div>

      {/* ── Who's watching? ── */}
      <h1 className="text-xl sm:text-2xl font-bold font-heading text-white mb-5 sm:mb-7 fade-in z-10"
          style={{ animationDelay: '0.1s' }}>
        Who's watching?
      </h1>

      {/* ── Profile Grid ── */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 z-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shimmer" />
              <div className="w-14 h-3 rounded shimmer" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid gap-3 sm:gap-4.5 px-2 fade-in z-10"
          style={{
            gridTemplateColumns: `repeat(${Math.min(users.length, 5)}, minmax(0, 1fr))`,
            animationDelay: '0.2s',
            maxWidth: 680,
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
                className="group flex flex-col items-center gap-2 focus:outline-none cursor-pointer"
              >
                {/* Avatar */}
                <div
                  className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden transition-all duration-300 ${
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
                    <span className="text-3xl sm:text-4xl font-black font-heading text-white/90 select-none"
                          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                      {user.username?.[0]?.toUpperCase()}
                    </span>
                  </div>

                  {/* Country flag */}
                  <span className="absolute top-1.5 right-1.5 text-base sm:text-lg leading-none">{flag}</span>

                  {/* Cold start badge */}
                  {user.is_cold_start && (
                    <span className="absolute bottom-1.5 left-1.5 text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-amber-500/80 text-black">
                      NEW
                    </span>
                  )}

                  {/* Selected overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#e50914]/25 flex items-center justify-center">
                      <ChevronRight className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="text-center max-w-[110px]">
                  <p className={`text-xs sm:text-sm font-semibold truncate transition-colors duration-200 ${
                    isSelected ? 'text-[#e50914]' : 'text-[#a3a3b3] group-hover:text-white'
                  }`}>
                    {user.username}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-[#5a5a6e] mt-0.5 truncate">
                    {user.country} · Age {user.age}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Footer hint ── */}
      <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-[#5a5a6e] fade-in z-10 text-center" style={{ animationDelay: '0.3s' }}>
        Select a profile to personalize your recommendations
      </p>

      {/* ── Bottom branding ── */}
      <div className="mt-4 mb-2 text-[11px] text-[#2a2a3a] font-mono z-10 text-center">
        CineGraph © 2026 — DBMS Academic Project · Neo4j 5.x
      </div>
    </div>
  );
};
