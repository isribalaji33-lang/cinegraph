import React, { useEffect, useState } from 'react';
import { Search, Sparkles, TrendingUp, Award, Film, Filter } from 'lucide-react';
import { fetchJson } from '../api/client';
import { PosterCard } from '../components/PosterCard';
import { RatingModal } from '../components/RatingModal';

interface HomeProps {
  currentUser: string;
}

export const Home: React.FC<HomeProps> = ({ currentUser }) => {
  const [movies, setMovies] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [ratingMovieId, setRatingMovieId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const GENRE_LIST = [
    'All', 'Sci-Fi', 'Action', 'Drama', 'Thriller', 'Romance',
    'Adventure', 'Crime', 'Comedy', 'Fantasy', 'Animation'
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [allMovies, userRecs] = await Promise.all([
        fetchJson<any[]>('/movies'),
        fetchJson<any[]>('/recommendations', {
          method: 'POST',
          body: JSON.stringify({ user_id: currentUser, limit: 6 })
        })
      ]);
      setMovies(allMovies);
      setRecs(userRecs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const filteredMovies = movies.filter((m) => {
    const matchesSearch = searchQuery
      ? m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.director_name && m.director_name.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    const matchesGenre = selectedGenre && selectedGenre !== 'All'
      ? m.genres.includes(selectedGenre)
      : true;
    return matchesSearch && matchesGenre;
  });

  const trendingMovies = [...movies].sort((a, b) => b.rating_count - a.rating_count).slice(0, 6);
  const topRatedMovies = [...movies].sort((a, b) => b.avg_rating - a.avg_rating).slice(0, 6);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 border border-cine-border shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NEO4J GRAPH-POWERED RECOMMENDATION ENGINE</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
            Discover the connections. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400">
              Find your next favorite.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            CineGraph combines collaborative graph traversals, content DNA similarity, and auteur bridges in Neo4j to generate fully explainable recommendations.
          </p>

          {/* Search bar */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, director, cast, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-cine-border rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Recommendations Row */}
      {recs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-400" />
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
                Recommended For You
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Hybrid Scoring (40% Collab, 30% Content, 20% Graph, 10% Pop)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recs.map((item) => (
              <PosterCard
                key={item.movie_id}
                movie={item}
                onRate={(id) => setRatingMovieId(id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending Activity Row */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Trending Activity
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Derived from active RATED relationship volumes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingMovies.map((movie) => (
            <PosterCard
              key={movie.movie_id}
              movie={movie}
              onRate={(id) => setRatingMovieId(id)}
            />
          ))}
        </div>
      </section>

      {/* Genre Filter & All Movies */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
              Explore Catalog ({filteredMovies.length} Films)
            </h2>
          </div>

          {/* Genre chips */}
          <div className="flex flex-wrap gap-1.5">
            {GENRE_LIST.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g === 'All' ? null : g)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  (selectedGenre === g || (g === 'All' && !selectedGenre))
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-cine-card border border-cine-border text-slate-300 hover:bg-cine-hover'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <PosterCard
              key={movie.movie_id}
              movie={movie}
              onRate={(id) => setRatingMovieId(id)}
            />
          ))}
        </div>
      </section>

      {/* Rating Modal */}
      <RatingModal
        movieId={ratingMovieId}
        userId={currentUser}
        onClose={() => setRatingMovieId(null)}
        onSuccess={loadData}
      />
    </div>
  );
};
