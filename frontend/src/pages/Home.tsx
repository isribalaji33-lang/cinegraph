import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, TrendingUp, Award, Film, Search, Play,
  Info, ChevronRight, ChevronLeft, Zap, Network, Star,
  BarChart3, Activity, ArrowRight, Users,
} from 'lucide-react';
import { fetchJson } from '../api/client';
import { PosterCard } from '../components/PosterCard';
import { RatingModal } from '../components/RatingModal';
import { getBackdropUrl } from '../data/moviePosters';

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

/* ─── Hero Billboard ────────────────────────────────────── */
const HeroBillboard: React.FC<{
  featured?: any;
  searchQuery: string;
  onSearch: (q: string) => void;
}> = ({ featured, searchQuery, onSearch }) => {
  const title = featured?.title || 'Interstellar';
  const desc = featured?.description || 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.';
  const year = featured?.release_year || 2014;
  const duration = featured?.duration || 169;
  const rating = featured?.avg_rating || 4.8;
  const genres = featured?.genres || ['Sci-Fi', 'Drama', 'Adventure'];
  const backdropUrl = getBackdropUrl(featured?.movie_id || 'm02');

  return (
    <section className="relative -mx-4 sm:-mx-6 mb-6 overflow-hidden rounded-b-2xl border-b border-white/[0.08] shadow-2xl">
      {/* Background Cinematic Artwork with subtle graph overlay */}
      <div className="relative w-full h-[380px] sm:h-[420px] bg-[#08080C] overflow-hidden">
        <img
          src={backdropUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60 scale-105 transition-transform duration-1000"
        />

        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080C] via-[#08080C]/85 to-transparent w-full sm:w-3/4 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080C] via-[#08080C]/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(241,11,32,0.12),transparent_60%)] z-10 pointer-events-none" />

        {/* Content Area */}
        <div className="relative z-20 max-w-[1440px] h-full mx-auto px-4 sm:px-6 flex flex-col justify-end pb-8 pt-4">
          <div className="max-w-2xl space-y-3.5">
            {/* Tag Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F10B20]/20 text-[#F10B20] border border-[#F10B20]/30 shadow-sm">
                Featured Blockbuster
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-black/60 text-amber-300 border border-white/10">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {Number(rating).toFixed(1)} Rating
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {year} · {duration} min · {genres.slice(0, 2).join(', ')}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-white uppercase drop-shadow-md">
              {title}
            </h1>

            {/* Subtitle / Synopsis with high contrast */}
            <p className="text-xs sm:text-sm text-[#E2E8F0] leading-relaxed line-clamp-2 max-w-xl">
              {desc}
            </p>

            {/* Search Input Field */}
            <div className="relative max-w-lg pt-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearch(e.target.value)}
                placeholder="Search movies, directors, genres in Neo4j..."
                className="w-full h-11 pl-10 pr-14 rounded-xl bg-black/70 border border-white/15 text-white placeholder-[#64748B] text-xs sm:text-sm focus:outline-none focus:border-[#F10B20] focus:ring-1 focus:ring-[#F10B20] backdrop-blur-md transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearch('')}
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
              {featured?.movie_id && (
                <Link
                  to={`/movies/${featured.movie_id}`}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-center gap-1.5"
                >
                  <Info className="w-4 h-4" />
                  <span>View Details</span>
                </Link>
              )}
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
