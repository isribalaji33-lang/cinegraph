import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Calendar, Bookmark, Eye } from 'lucide-react';

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
  };
  onRate?: (movieId: string) => void;
  onWatch?: (movieId: string) => void;
  onWatchlist?: (movieId: string) => void;
}

// Consistent aesthetic gradient palettes for typographic cards based on movie title hash
const POSTER_PALETTES = [
  'from-slate-900 via-rose-950/80 to-slate-950',
  'from-slate-900 via-indigo-950/80 to-slate-950',
  'from-slate-900 via-emerald-950/80 to-slate-950',
  'from-slate-900 via-amber-950/80 to-slate-950',
  'from-slate-900 via-purple-950/80 to-slate-950',
  'from-slate-900 via-cyan-950/80 to-slate-950',
];

export const PosterCard: React.FC<MovieCardProps> = ({ movie, onRate, onWatch, onWatchlist }) => {
  const hash = movie.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palette = POSTER_PALETTES[hash % POSTER_PALETTES.length];

  return (
    <div className="group relative rounded-2xl overflow-hidden glass-panel glass-panel-hover flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-950/20">
      {/* Visual Header / Poster area */}
      <Link to={`/movies/${movie.movie_id}`} className="block relative aspect-[16/10] overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${palette} flex flex-col justify-end p-4 transition-transform duration-500 group-hover:scale-105`}>
          {/* Subtle decorative background film grain & initial */}
          <span className="absolute top-2 right-3 text-7xl font-bold font-heading text-white/5 select-none pointer-events-none">
            {movie.title.charAt(0)}
          </span>

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
            {movie.hybrid_score !== undefined && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-600/90 text-white shadow-md">
                Match {Math.round(movie.hybrid_score * 100)}%
              </span>
            )}
            {movie.avg_rating !== undefined && movie.avg_rating > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {movie.avg_rating}
              </span>
            )}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-1 mt-auto">
            {movie.genres?.slice(0, 2).map((g) => (
              <span key={g} className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-slate-200 backdrop-blur-md">
                {g}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* Body Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/movies/${movie.movie_id}`} className="block">
            <h3 className="font-heading font-bold text-base text-white group-hover:text-rose-400 transition-colors line-clamp-1">
              {movie.title}
            </h3>
          </Link>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {movie.release_year}
            </span>
            {movie.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {movie.duration}m
              </span>
            )}
            {movie.director_name && (
              <span className="truncate max-w-[120px]" title={movie.director_name}>
                Dir. {movie.director_name}
              </span>
            )}
          </div>

          {movie.description && (
            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
              {movie.description}
            </p>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <Link
            to={`/movies/${movie.movie_id}`}
            className="text-slate-300 hover:text-white font-medium hover:underline"
          >
            Details →
          </Link>
          <div className="flex items-center gap-1">
            {onRate && (
              <button
                onClick={() => onRate(movie.movie_id)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-amber-400 transition-colors"
                title="Rate this movie"
              >
                <Star className="w-4 h-4" />
              </button>
            )}
            {onWatch && (
              <button
                onClick={() => onWatch(movie.movie_id)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-emerald-400 transition-colors"
                title="Mark as watched"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onWatchlist && (
              <button
                onClick={() => onWatchlist(movie.movie_id)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-rose-400 transition-colors"
                title="Add to watchlist"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
