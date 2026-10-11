import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, TrendingUp, Award, Film, Search, Play,
  Info, ChevronRight, ChevronLeft, Zap, Network, Star,
  BarChart3, Activity, ArrowRight,
} from 'lucide-react';
import { fetchJson } from '../api/client';
import { PosterCard } from '../components/PosterCard';
import { RatingModal } from '../components/RatingModal';

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
  stats: { movies: number; users: number; rels: number };
}> = ({ featured, searchQuery, onSearch, stats }) => {
  const title = featured?.title || 'CineGraph';
  const desc = featured?.description || 'Discover the connections. Find your next favorite film with Neo4j graph-powered intelligence.';
  const genre = featured?.genres?.[0] || 'Sci-Fi';

  return (
    <section className="relative -mx-4 sm:-mx-6 mb-10">
      {/* Background Art */}
      <div className="relative overflow-hidden" style={{ minHeight: 520 }}>
        {/* Gradient BG */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 70% 40%, #6b001540 0%, #0a0a0f 65%)',
          }}
        />
        {/* Animated particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              background: i % 3 === 0 ? '#e50914' : i % 3 === 1 ? '#018bff' : '#f5c518',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 pt-12 pb-16">
          <div className="max-w-2xl space-y-5">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <span className="badge badge-red">
                <Network className="w-3 h-3" /> Neo4j Graph-Powered
              </span>
              <span className="badge badge-blue">
                <Activity className="w-3 h-3" /> Live ML Engine
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading leading-none tracking-tight text-white">
                Cine<span style={{ color: '#e50914' }}>Graph</span>
              </h1>
              <p className="mt-2 text-base sm:text-lg text-[#a3a3b3] leading-relaxed max-w-xl">
                Discover the connections. Find your next favorite with graph traversals, content DNA, and ML.
              </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a6e]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearch(e.target.value)}
                placeholder="Search movies, directors, genres..."
                className="nf-input pl-11 h-12 text-sm"
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              <Link to="/recommendations" className="btn-primary">
                <Sparkles className="w-4 h-4" />
                Get Recommendations
              </Link>
              <Link to="/lab" className="btn-secondary">
                <Network className="w-4 h-4" />
                Neo4j Live Lab
              </Link>
            </div>

            {/* Live Stats */}
            <div className="flex items-center gap-6 pt-2">
              {[
                { label: 'Films', value: stats.movies, color: '#e50914' },
                { label: 'Users', value: stats.users, color: '#018bff' },
                { label: 'Graph Links', value: stats.rels, color: '#f5c518' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black font-heading" style={{ color: s.color }}>
                    {s.value > 0 ? s.value.toLocaleString() : '—'}
                  </p>
                  <p className="text-[10px] text-[#5a5a6e] uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
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
    <div className="min-h-screen space-y-10 pb-20 -mx-4 sm:-mx-6 px-4 sm:px-6">

      {/* ── Hero Billboard ── */}
      <HeroBillboard
        featured={featured}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        stats={stats}
      />

      {/* ── Search / Filter Results ── */}
      {showCatalog && (
        <section className="space-y-4 fade-up">
          {/* Genre Filter */}
          <GenreStrip selected={selectedGenre} onChange={setSelectedGenre} />

          <div className="flex items-center gap-2 mb-2">
            <Film className="w-5 h-5 text-[#e50914]" />
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
          {/* Personalized Recommendations */}
          <MovieRow
            title="Recommended For You"
            subtitle="Hybrid scoring: 40% Collab · 30% Content · 20% Graph · 10% Pop"
            icon={<Sparkles className="w-5 h-5 text-[#e50914]" />}
            movies={recs}
            loading={recsLoading}
            onRate={setRatingMovieId}
            badgeLabel="Hybrid ML"
            badgeColor="#e50914"
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
