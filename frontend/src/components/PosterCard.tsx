import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Play, Bookmark, Eye, Info, Plus } from 'lucide-react';
import { getPosterUrl } from '../data/moviePosters';

interface MovieCardProps {
  movie: {
    movie_id: string;
    title: string;
    release_year: number;
    duration?: number;
    genres?: string[];
    director_name?: string;
    avg_rating?: number;
    rating_count?: number;
    hybrid_score?: number;
    description?: string;
    language?: string;
    age_rating?: string;
  };
  onRate?: (movieId: string) => void;
  onWatch?: (movieId: string) => void;
  onWatchlist?: (movieId: string) => void;
  variant?: 'default' | 'hero-row' | 'featured';
}

// Netflix-style gradient palettes keyed by title hash
const PALETTES = [
  { from: '#1a0011', via: '#6b0020', to: '#0a0005' },
  { from: '#001427', via: '#003366', to: '#000a14' },
  { from: '#0d1117', via: '#1e3a1e', to: '#060d06' },
  { from: '#1a1000', via: '#5c3d00', to: '#0a0800' },
  { from: '#150020', via: '#4a0080', to: '#080010' },
  { from: '#001a1a', via: '#005555', to: '#000d0d' },
  { daylight: false, from: '#1a0022', via: '#6600aa', to: '#0a0012' },
  { from: '#1a0808', via: '#7a1a1a', to: '#0a0404' },
];

const GENRE_COLORS: Record<string, string> = {
  'Sci-Fi':     '#60c3ff',
  'Action':     '#ff6b6b',
  'Drama':      '#c084fc',
  'Thriller':   '#f97316',
  'Romance':    '#fb7185',
  'Crime':      '#fbbf24',
  'Comedy':     '#4ade80',
  'Fantasy':    '#818cf8',
  'Animation':  '#34d399',
  'Adventure':  '#38bdf8',
  'Horror':     '#ef4444',
  'Mystery':    '#a78bfa',
};

function hashStr(s: string): number {
  return s.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function PosterArt({ title, genres, palette }: { title: string; genres?: string[]; palette: typeof PALETTES[0] }) {
  const initial = title.charAt(0);
  const genre1 = genres?.[0] || '';
  const accentColor = GENRE_COLORS[genre1] || '#e50914';

  return (
    <div
      className="w-full h-full absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 60% 40%, ${palette.via}80 0%, ${palette.from} 50%, ${palette.to} 100%)`,
      }}
    >
      {/* Decorative rings */}
      <div
        className="absolute w-48 h-48 rounded-full opacity-10"
        style={{
          border: `2px solid ${accentColor}`,
          top: '-20%', right: '-15%',
        }}
      />
      <div
        className="absolute w-32 h-32 rounded-full opacity-10"
        style={{
          border: `1px solid ${accentColor}`,
          bottom: '10%', left: '-10%',
        }}
      />

      {/* Large initial letter */}
      <span
        className="font-heading font-black select-none leading-none"
        style={{
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          color: accentColor,
          opacity: 0.9,
          textShadow: `0 0 60px ${accentColor}60`,
        }}
      >
        {initial}
      </span>

      {/* Gradient overlay from bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
    </div>
  );
}

export const PosterCard: React.FC<MovieCardProps> = ({
  movie,
  onRate,
  onWatch,
  onWatchlist,
  variant = 'default',
}) => {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const posterUrl = getPosterUrl(movie.movie_id);
  const hash = hashStr(movie.title);
  const palette = PALETTES[hash % PALETTES.length];
  const genre1 = movie.genres?.[0] || '';
  const accentColor = GENRE_COLORS[genre1] || '#e50914';

  const isHeroRow = variant === 'hero-row';

  return (
    <div
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border border-white/[0.08] bg-[#111116] ${
        isHeroRow
          ? 'aspect-[2/3] min-w-[155px] sm:min-w-[170px] hover:-translate-y-1.5 hover:border-white/20 hover:shadow-xl'
          : 'hover:-translate-y-1 hover:border-white/20 hover:shadow-xl'
      }`}
      style={{
        boxShadow: hovered
          ? `0 16px 36px rgba(0,0,0,0.7), 0 0 0 1px ${accentColor}40`
          : '0 4px 16px rgba(0,0,0,0.5)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Poster Art Area ── */}
      <Link to={`/movies/${movie.movie_id}`} className="block relative w-full h-full overflow-hidden bg-[#0A0A0E]">
        {posterUrl && !imgError ? (
          <>
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
            {/* Ambient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />
          </>
        ) : (
          <PosterArt title={movie.title} genres={movie.genres} palette={palette} />
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
          {movie.hybrid_score !== undefined && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white bg-[#F10B20] shadow-sm">
              {Math.round(movie.hybrid_score * 100)}% Match
            </span>
          )}
          {movie.avg_rating !== undefined && movie.avg_rating > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/75 backdrop-blur-sm text-amber-300 flex items-center gap-0.5 border border-white/10">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              {Number(movie.avg_rating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Age Rating */}
        {movie.age_rating && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono border border-white/20 bg-black/75 backdrop-blur-sm text-white/80">
              {movie.age_rating}
            </span>
          </div>
        )}

        {/* Bottom Title & Metadata Overlay (Always legible) */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col justify-end z-10 pointer-events-none">
          <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#F10B20] transition-colors">
            {movie.title}
          </p>
          <div className="flex items-center justify-between text-[10px] text-[#94A3B8] mt-0.5 font-mono">
            <span>{movie.release_year} {movie.duration ? `· ${movie.duration}m` : ''}</span>
            {movie.genres?.[0] && (
              <span className="text-zinc-300 font-sans truncate max-w-[70px]">
                {movie.genres[0]}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ── Info Panel (default variant only) ── */}
      {!isHeroRow && (
        <div className="p-3 bg-[#16161f]">
          <Link to={`/movies/${movie.movie_id}`}>
            <h3
              className="font-heading font-bold text-sm text-white line-clamp-1 hover:text-[#e50914] transition-colors"
              title={movie.title}
            >
              {movie.title}
            </h3>
          </Link>

          <div className="flex items-center gap-2.5 text-[11px] text-[#5a5a6e] mt-1">
            <span>{movie.release_year}</span>
            {movie.duration && <span>{movie.duration}m</span>}
            {movie.director_name && (
              <span className="truncate max-w-[100px]" title={movie.director_name}>
                {movie.director_name}
              </span>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
            <Link
              to={`/movies/${movie.movie_id}`}
              className="flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              Details
            </Link>
            <div className="flex items-center gap-1">
              {onRate && (
                <button
                  onClick={e => { e.preventDefault(); onRate(movie.movie_id); }}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-[#5a5a6e] hover:text-amber-400 transition-colors"
                  title="Rate"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}
              {onWatch && (
                <button
                  onClick={e => { e.preventDefault(); onWatch(movie.movie_id); }}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-[#5a5a6e] hover:text-emerald-400 transition-colors"
                  title="Mark watched"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
              {onWatchlist && (
                <button
                  onClick={e => { e.preventDefault(); onWatchlist(movie.movie_id); }}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-[#5a5a6e] hover:text-[#e50914] transition-colors"
                  title="Add to watchlist"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
