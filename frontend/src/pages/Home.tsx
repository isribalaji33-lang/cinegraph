import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, TrendingUp, Award, Film, Search, Play, Pause,
  Info, ChevronRight, ChevronLeft, Zap, Network, Star,
  BarChart3, Activity, ArrowRight, Users,
} from 'lucide-react';

import { fetchJson } from '../api/client';
import { PosterCard } from '../components/PosterCard';
import { RatingModal } from '../components/RatingModal';
import { getBackdropUrl, BACKDROP_URLS } from '../data/moviePosters';



interface HomeProps { currentUser: string; }

/* ─── Skeleton ─────────────────────────────────────────── */
const RowSkeleton = () => (
  <div className="scroll-row py-1">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="shimmer rounded-xl flex-shrink-0"
        style={{ width: 160, height: 240, borderRadius: 12 }}
      />
    ))}
  </div>
);

/* ─── Horizontal Scrollable Row ────────────────────────── */
interface RowProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  movies: any[];
  loading: boolean;
  onRate: (id: string) => void;
  badgeLabel?: string;
  badgeColor?: string;
}

const MovieRow: React.FC<RowProps> = ({
  title, subtitle, icon, movies, loading, onRate, badgeLabel, badgeColor,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === 'right' ? 600 : -600, behavior: 'smooth' });
  };

  return (
    <section className="fade-up">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <span>{icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-heading text-white">{title}</h2>
              {badgeLabel && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border"
                  style={{ color: badgeColor || '#e50914', borderColor: `${badgeColor || '#e50914'}50`, background: `${badgeColor || '#e50914'}15` }}
                >
                  {badgeLabel}
                </span>
              )}
            </div>
            {subtitle && <p className="text-[11px] text-[#5a5a6e] mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#a3a3b3] hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#a3a3b3] hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Row */}
      {loading ? <RowSkeleton /> : (
        <div ref={rowRef} className="scroll-row pb-2">
          {movies.map(movie => (
            <div key={movie.movie_id} style={{ width: 160, minWidth: 160 }}>
              <PosterCard movie={movie} onRate={onRate} variant="hero-row" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

/* ─── Seed Showcase Movies for Immediate Hero Display ───── */
const SEED_SHOWCASE_MOVIES = [
  {
    movie_id: 'm02',
    title: 'Interstellar',
    description: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.",
    release_year: 2014,
    duration: 169,
    avg_rating: 4.8,
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    director_name: 'Christopher Nolan',
    badge: 'Epic Sci-Fi Showcase'
  },
  {
    movie_id: 'm01',
    title: 'Inception',
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    release_year: 2010,
    duration: 148,
    avg_rating: 4.7,
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    director_name: 'Christopher Nolan',
    badge: 'Mind-Bending Classic'
  },
  {
    movie_id: 'm04',
    title: 'Blade Runner 2049',
    description: "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
    release_year: 2017,
    duration: 164,
    avg_rating: 4.6,
    genres: ['Sci-Fi', 'Thriller', 'Mystery'],
    director_name: 'Denis Villeneuve',
    badge: 'Cyberpunk Masterpiece'
  },
  {
    movie_id: 'm13',
    title: 'Gladiator',
    description: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
    release_year: 2000,
    duration: 155,
    avg_rating: 4.7,
    genres: ['Action', 'Drama', 'Adventure'],
    director_name: 'Ridley Scott',
    badge: 'Historical Blockbuster'
  },
  {
    movie_id: 'm14',
    title: 'The Martian',
    description: "An astronaut becomes stranded on Mars after his team assume him dead, and must rely on his ingenuity to find a way to signal to Earth that he is alive.",
    release_year: 2015,
    duration: 144,
    avg_rating: 4.5,
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    director_name: 'Ridley Scott',
    badge: 'Survival Triumph'
  },
  {
    movie_id: 'm17',
    title: 'Parasite',
    description: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    release_year: 2019,
    duration: 132,
    avg_rating: 4.8,
    genres: ['Thriller', 'Drama', 'Comedy'],
    director_name: 'Bong Joon-ho',
    badge: 'Palme d\'Or Winner'
  },
  {
    movie_id: 'm23',
    title: 'Mad Max: Fury Road',
    description: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners and a drifter named Max.",
    release_year: 2015,
    duration: 120,
    avg_rating: 4.6,
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    director_name: 'George Miller',
    badge: 'High-Octane Action'
  },
  {
    movie_id: 'm29',
    title: 'Avatar',
    description: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.",
    release_year: 2009,
    duration: 162,
    avg_rating: 4.4,
    genres: ['Sci-Fi', 'Action', 'Adventure'],
    director_name: 'James Cameron',
    badge: 'Visual Frontier'
  }
];

const ROTATION_INTERVAL = 6000; // 6 seconds per slide

/* ─── Hero Billboard (Cinematic Autoplay Carousel) ──────── */
const HeroBillboard: React.FC<{
  movies?: any[];
  featured?: any;
  searchQuery: string;
  onSearch: (q: string) => void;
}> = ({ movies, searchQuery, onSearch }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);

  // Synchronize curated showcase movies with live backend database metadata
  const showcaseMovies = useMemo(() => {
    if (!movies || movies.length === 0) return SEED_SHOWCASE_MOVIES;
    const movieMap = new Map(movies.map(m => [m.movie_id, m]));
    return SEED_SHOWCASE_MOVIES.map(seed => {
      const live = movieMap.get(seed.movie_id);
      if (!live) return seed;
      return {
        ...seed,
        ...live,
        genres: Array.isArray(live.genres) && live.genres.length > 0 ? live.genres : seed.genres,
        avg_rating: live.avg_rating ?? seed.avg_rating,
        release_year: live.release_year ?? seed.release_year,
        duration: live.duration ?? seed.duration,
        description: live.description || seed.description,
        title: live.title || seed.title,
        director_name: live.director_name || seed.director_name,
        badge: seed.badge,
      };
    });
  }, [movies]);

  // Preload all backdrop images into browser cache immediately
  useEffect(() => {
    showcaseMovies.forEach(m => {
      const url = getBackdropUrl(m.movie_id);
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [showcaseMovies]);

  // Track tab visibility changes so rotation pauses when backgrounded
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Continuous auto-movement: only pause if user is actively searching or clicked pause
  const isPaused = isSearchFocused || isTabHidden || isManuallyPaused;

  // Autoplay timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % showcaseMovies.length);
    }, ROTATION_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, showcaseMovies.length, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + showcaseMovies.length) % showcaseMovies.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % showcaseMovies.length);
  };

  const activeMovie = showcaseMovies[currentIndex] || showcaseMovies[0];
  const activeRating = activeMovie?.avg_rating ? Number(activeMovie.avg_rating).toFixed(1) : '4.8';
  const activeGenres = (activeMovie?.genres || ['Sci-Fi', 'Drama']).slice(0, 3).join(' · ');

  return (
    <section
      className="group relative -mx-4 sm:-mx-6 mb-6 overflow-hidden rounded-b-2xl border-b border-white/[0.08] shadow-2xl select-none"
      aria-roledescription="carousel"
      aria-label="CineGraph Featured Movie Showcase"
    >
      {/* ── Background Layered Artwork with Ken Burns effect & Smooth Crossfade ── */}
      <div className="relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[520px] bg-[#08080C] overflow-hidden flex flex-col justify-end">
        {showcaseMovies.map((movie, idx) => {
          const isActive = idx === currentIndex;
          const backdrop = getBackdropUrl(movie.movie_id);
          return (
            <div
              key={movie.movie_id}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={backdrop}
                alt={movie.title}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== BACKDROP_URLS.m02) {
                    target.src = BACKDROP_URLS.m02; // Reliable Interstellar fallback
                  }
                }}
                className={`w-full h-full object-cover object-center ${
                  isActive ? 'animate-ken-burns' : ''
                }`}
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </div>
          );
        })}

        {/* Cinematic gradient overlays for high text contrast and seamless blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080C] via-[#08080C]/90 to-transparent w-full md:w-3/4 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080C] via-[#08080C]/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(241,11,32,0.14),transparent_65%)] z-10 pointer-events-none" />

        {/* ── Left / Right Navigation Arrows (Visible on hover or keyboard focus) ── */}
        <button
          onClick={handlePrev}
          aria-label={`Previous movie: ${showcaseMovies[(currentIndex - 1 + showcaseMovies.length) % showcaseMovies.length].title}`}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-[#F10B20] text-white/80 hover:text-white border border-white/15 hover:border-[#F10B20] shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <button
          onClick={handleNext}
          aria-label={`Next movie: ${showcaseMovies[(currentIndex + 1) % showcaseMovies.length].title}`}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-[#F10B20] text-white/80 hover:text-white border border-white/15 hover:border-[#F10B20] shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* ── Hero Foreground Content ── */}
        <div className="relative z-20 max-w-[1440px] w-full mx-auto px-4 sm:px-8 pb-8 pt-6 flex flex-col justify-end">
          <div className="max-w-2xl space-y-3.5">
            {/* Animated synchronized text block */}
            <div key={activeMovie.movie_id} className="space-y-3 animate-hero-text">
              {/* Badge & Metadata Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F10B20]/20 text-[#F10B20] border border-[#F10B20]/40 shadow-sm backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F10B20] animate-pulse" />
                  {activeMovie.badge || 'Featured Blockbuster'}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-black/70 text-amber-300 border border-amber-500/20 shadow-sm">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {activeRating} Rating
                </span>

                <span className="text-xs font-mono text-zinc-300 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                  {activeMovie.release_year} · {activeMovie.duration} min · {activeGenres}
                </span>

                {activeMovie.director_name && (
                  <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                    Dir. {activeMovie.director_name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-white uppercase drop-shadow-xl leading-none">
                {activeMovie.title}
              </h1>

              {/* Synopsis */}
              <p className="text-xs sm:text-sm text-[#E2E8F0] leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-xl drop-shadow">
                {activeMovie.description}
              </p>
            </div>

            {/* Search Input Field (Persistent state, does not unmount during movie change) */}
            <div className="relative max-w-lg pt-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search movies, directors, genres in Neo4j..."
                aria-label="Search movies, directors, genres"
                className="w-full h-11 pl-10 pr-14 rounded-xl bg-black/75 border border-white/15 text-white placeholder-[#64748B] text-xs sm:text-sm focus:outline-none focus:border-[#F10B20] focus:ring-1 focus:ring-[#F10B20] backdrop-blur-md transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearch('')}
                  aria-label="Clear search input"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/recommendations" className="btn-primary text-xs sm:text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Get Recommendations</span>
              </Link>

              <Link to="/lab" className="btn-secondary text-xs sm:text-sm">
                <Network className="w-4 h-4 text-cyan-400" />
                <span>Neo4j Live Lab</span>
              </Link>

              <Link
                to={`/movies/${activeMovie.movie_id}`}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Info className="w-4 h-4 text-red-400" />
                <span>View Details</span>
              </Link>
            </div>
          </div>

          {/* ── Carousel Bottom Controls (Indicators & Autoplay Status) ── */}
          <div className="mt-6 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Pagination Indicators */}
            <div className="flex items-center gap-2" role="tablist" aria-label="Movie carousel pagination">
              {showcaseMovies.map((movie, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={movie.movie_id}
                    onClick={() => setCurrentIndex(idx)}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Show ${movie.title} (${idx + 1} of ${showcaseMovies.length})`}
                    className={`relative rounded-full transition-all duration-300 overflow-hidden cursor-pointer ${
                      isActive
                        ? 'w-10 sm:w-14 h-2 bg-white/20 shadow-sm'
                        : 'w-2 sm:w-2.5 h-2 bg-white/30 hover:bg-white/60'
                    }`}
                  >
                    {isActive && (
                      <span
                        key={`bar-${currentIndex}-${isPaused ? 'paused' : 'running'}`}
                        className={`absolute inset-0 bg-[#F10B20] rounded-full ${
                          isPaused ? 'w-full' : 'animate-hero-progress'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Autoplay Play/Pause Toggle & Movie Counter */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsManuallyPaused(prev => !prev)}
                aria-label={isManuallyPaused ? "Resume autoplay" : "Pause autoplay"}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-[11px] font-mono transition-colors cursor-pointer"
              >
                {isManuallyPaused ? (
                  <>
                    <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Auto (6s)</span>
                  </>
                )}
              </button>

              <span className="font-mono text-[11px] text-zinc-400">
                <span className="text-white font-bold">0{currentIndex + 1}</span> / 0{showcaseMovies.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};



/* ─── Genre Filter Strip ────────────────────────────────── */
const GENRES = ['All', 'Sci-Fi', 'Action', 'Drama', 'Thriller', 'Romance',
                'Adventure', 'Crime', 'Comedy', 'Fantasy', 'Animation', 'Horror'];

const GenreStrip: React.FC<{
  selected: string | null;
  onChange: (g: string | null) => void;
}> = ({ selected, onChange }) => (
  <div className="scroll-row py-1">
    {GENRES.map(g => (
      <button
        key={g}
        onClick={() => onChange(g === 'All' ? null : g)}
        className={`genre-pill ${(selected === g || (g === 'All' && !selected)) ? 'active' : ''}`}
      >
        {g}
      </button>
    ))}
  </div>
);

/* ─── Full Movie Grid ───────────────────────────────────── */
const MovieGrid: React.FC<{
  movies: any[];
  loading: boolean;
  onRate: (id: string) => void;
}> = ({ movies, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="shimmer rounded-xl" style={{ aspectRatio: '2/3', borderRadius: 12 }} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {movies.map(m => (
        <PosterCard key={m.movie_id} movie={m} variant="hero-row" />
      ))}
      {movies.length === 0 && (
        <div className="col-span-full text-center py-20 text-[#5a5a6e]">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No films match your filter.</p>
        </div>
      )}
    </div>
  );
};

/* ─── Feature Shortcut Cards ────────────────────────────── */
const FEATURE_CARDS = [
  {
    to: '/lab',
    icon: <Network className="w-6 h-6" />,
    title: 'Neo4j Live Lab',
    desc: 'Run Cypher, visualize the graph, and watch traversals live.',
    badge: 'Pillar 1',
    gradient: 'from-blue-900/60 to-cyan-900/30',
    border: 'border-blue-500/30',
    color: '#018bff',
  },
  {
    to: '/recommendations',
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Hybrid Recommender',
    desc: 'Collab filtering + content DNA + graph traversal signals.',
    badge: 'Pillar 2',
    gradient: 'from-rose-900/60 to-orange-900/30',
    border: 'border-rose-500/30',
    color: '#e50914',
  },
  {
    to: '/compare',
    icon: <Scale className="w-6 h-6" />,
    title: 'Compare & What-If',
    desc: 'Side-by-side user tastes + live rating simulation.',
    badge: 'Pillar 3',
    gradient: 'from-purple-900/60 to-pink-900/30',
    border: 'border-purple-500/30',
    color: '#a855f7',
  },
  {
    to: '/ml-eval',
    icon: <Activity className="w-6 h-6" />,
    title: 'ML Evaluation',
    desc: 'Precision@K, NDCG@K, RMSE, MAE with ablation study.',
    badge: 'Pillar 3',
    gradient: 'from-emerald-900/60 to-teal-900/30',
    border: 'border-emerald-500/30',
    color: '#10b981',
  },
];

function Scale(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3v18M5 12h14M3 6l9 3 9-3M3 18l9-3 9 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Home Page ─────────────────────────────────────────── */
export const Home: React.FC<HomeProps> = ({ currentUser }) => {
  const [movies, setMovies] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [ratingMovieId, setRatingMovieId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recsLoading, setRecsLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    setRecsLoading(true);
    try {
      const [allMovies, analyticsData] = await Promise.all([
        fetchJson<any[]>('/movies?limit=60'),
        fetchJson<any>('/analytics/overview'),
      ]);
      setMovies(allMovies);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load movies/analytics', err);
    } finally {
      setLoading(false);
    }

    try {
      const userRecs = await fetchJson<any[]>('/recommendations', {
        method: 'POST',
        body: JSON.stringify({ user_id: currentUser, limit: 12 }),
      });
      setRecs(userRecs);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setRecsLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [currentUser]);

  // If initial load returned empty (e.g. backend was waking up from cold sleep), retry automatically
  useEffect(() => {
    if (movies.length === 0 && !loading) {
      const retryTimer = setTimeout(() => {
        loadAll();
      }, 3500);
      return () => clearTimeout(retryTimer);
    }
  }, [movies.length, loading]);

  // Derived data
  const trending = [...movies].sort((a, b) => b.rating_count - a.rating_count).slice(0, 12);
  const topRated = [...movies].sort((a, b) => b.avg_rating - a.avg_rating).slice(0, 12);
  const newReleases = [...movies].sort((a, b) => b.release_year - a.release_year).slice(0, 12);

  const filteredMovies = movies.filter(m => {
    const matchSearch = !searchQuery || (
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.director_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchGenre = !selectedGenre || (m.genres || []).includes(selectedGenre);
    return matchSearch && matchGenre;
  });

  const stats = {
    movies: analytics?.node_counts?.Movies || movies.length,
    users: analytics?.node_counts?.Users || 0,
    rels: Object.values(analytics?.relationship_counts || {}).reduce((a: number, b: any) => a + b, 0) as number,
  };

  const featured = trending[0];

  const showCatalog = searchQuery || selectedGenre;

  return (
    <div className="min-h-screen space-y-8 pb-20 -mx-4 sm:-mx-6 px-4 sm:px-6">

      {/* ── Hero Billboard ── */}
      <HeroBillboard
        movies={movies}
        featured={featured}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />


      {/* ── 3 Compact Aligned Statistic Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#F10B20] shrink-0">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xl font-black font-heading text-white">
              {stats.movies > 0 ? stats.movies : '30'}
            </p>
            <p className="text-[11px] font-semibold text-zinc-300">Films Indexed</p>
            <p className="text-[10px] text-[#64748B] font-mono">Catalog nodes in Neo4j AuraDB</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#018BFF] shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xl font-black font-heading text-white">
              {stats.users > 0 ? stats.users : '15'}
            </p>
            <p className="text-[11px] font-semibold text-zinc-300">Active Profiles</p>
            <p className="text-[10px] text-[#64748B] font-mono">Stratified taste clusters</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#F59E0B] shrink-0">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xl font-black font-heading text-white">
              {stats.rels > 0 ? stats.rels.toLocaleString() : '569'}
            </p>
            <p className="text-[11px] font-semibold text-zinc-300">Graph Relationships</p>
            <p className="text-[10px] text-[#64748B] font-mono">Multi-hop traversal connections</p>
          </div>
        </div>
      </div>

      {/* ── Search / Filter Results ── */}
      {showCatalog && (
        <section className="space-y-4 fade-up">
          {/* Genre Filter */}
          <GenreStrip selected={selectedGenre} onChange={setSelectedGenre} />

          <div className="flex items-center gap-2 mb-2">
            <Film className="w-5 h-5 text-[#F10B20]" />
            <h2 className="text-lg font-bold font-heading text-white">
              {searchQuery ? `Results for "${searchQuery}"` : selectedGenre} ({filteredMovies.length})
            </h2>
          </div>
          <MovieGrid movies={filteredMovies} loading={loading} onRate={setRatingMovieId} />
        </section>
      )}

      {/* ── Content Rows (when no search) ── */}
      {!showCatalog && (
        <>
          {/* Personalized Recommendations (Elevated Position) */}
          <MovieRow
            title="Recommended For You"
            subtitle="Multi-signal ensemble: 40% Collab · 30% Content · 20% Graph · 10% Pop"
            icon={<Sparkles className="w-5 h-5 text-[#F10B20]" />}
            movies={recs}
            loading={recsLoading}
            onRate={setRatingMovieId}
            badgeLabel="Hybrid ML"
            badgeColor="#F10B20"
          />

          {/* Trending */}
          <MovieRow
            title="Trending Right Now"
            subtitle="By RATED relationship volume in Neo4j"
            icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
            movies={trending}
            loading={loading}
            onRate={setRatingMovieId}
          />

          {/* Top Rated */}
          <MovieRow
            title="Highest Rated"
            subtitle="By average star rating across all users"
            icon={<Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
            movies={topRated}
            loading={loading}
            onRate={setRatingMovieId}
          />

          {/* New Releases */}
          <MovieRow
            title="Latest Releases"
            subtitle="Most recent films in the catalog"
            icon={<Film className="w-5 h-5 text-cyan-400" />}
            movies={newReleases}
            loading={loading}
            onRate={setRatingMovieId}
          />

          {/* ── Genre Filter Strip + Full Browse ── */}
          <section className="space-y-4 fade-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#5a5a6e]" />
                <h2 className="text-lg font-bold font-heading text-white">Browse by Genre</h2>
              </div>
            </div>
            <GenreStrip selected={selectedGenre} onChange={setSelectedGenre} />
          </section>

          {/* ── Feature Cards ── */}
          <section className="fade-up">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold font-heading text-white">Project Pillars</h2>
              <span className="text-[11px] text-[#5a5a6e] ml-2">Demo-ready DBMS + ML features</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURE_CARDS.map(card => (
                <Link
                  key={card.to}
                  to={card.to}
                  className={`group relative rounded-xl p-5 bg-gradient-to-br ${card.gradient} border ${card.border} hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                  style={{ '--hover-shadow': `${card.color}30` } as any}
                >
                  <div style={{ color: card.color }} className="mb-3">{card.icon}</div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-white text-sm">{card.title}</h3>
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border"
                      style={{ color: card.color, borderColor: `${card.color}40`, background: `${card.color}15` }}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#a3a3b3] leading-relaxed">{card.desc}</p>
                  <ArrowRight
                    className="absolute bottom-4 right-4 w-4 h-4 text-[#5a5a6e] group-hover:text-white transition-colors"
                  />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Rating Modal */}
      <RatingModal
        movieId={ratingMovieId}
        userId={currentUser}
        onClose={() => setRatingMovieId(null)}
        onSuccess={loadAll}
      />
    </div>
  );
};
