import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Sliders, Info, ShieldCheck, Star, GitBranch, ArrowRight, RefreshCw, Film } from 'lucide-react';
import { fetchJson } from '../api/client';
import { RatingModal } from '../components/RatingModal';
import { getPosterUrl } from '../data/moviePosters';

interface RecommendationsProps {
  currentUser: string;
}

export const Recommendations: React.FC<RecommendationsProps> = ({ currentUser }) => {
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingMovieId, setRatingMovieId] = useState<string | null>(null);

  // Tunable Weights
  const [weights, setWeights] = useState({
    collaborative: 0.40,
    content: 0.30,
    graph: 0.20,
    popularity: 0.10,
  });

  const [genreFilter, setGenreFilter] = useState('');
  const [minYear, setMinYear] = useState<number | undefined>(undefined);

  const loadRecs = async () => {
    setLoading(true);
    try {
      const data = await fetchJson<any[]>('/recommendations', {
        method: 'POST',
        body: JSON.stringify({
          user_id: currentUser,
          limit: 10,
          weights: weights,
          genre_filter: genreFilter || undefined,
          min_year: minYear || undefined,
        }),
      });
      setRecs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecs();
  }, [currentUser, weights, genreFilter, minYear]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PILLAR 2: EXPLAINABLE RECOMMENDATIONS</span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-white">
            Personalized Recommendations
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Every candidate is scored using multi-attribute graph traversals and verifiable data signals. No canned sentences or random guesses.
          </p>
        </div>

        <button
          onClick={loadRecs}
          className="self-start md:self-auto px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cine-card border border-cine-border hover:bg-cine-hover text-slate-200 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-rank Live</span>
        </button>
      </div>

      {/* Tunable Weights Slider Panel */}
      <div className="glass-panel rounded-2xl p-6 border border-cine-border space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-rose-400" />
          <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
            Scoring Formula & Tunable Model Weights
          </h3>
        </div>

        <p className="text-xs text-slate-400">
          Adjust the sliders to dynamically tune the recommendation algorithm weights in real time:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {/* Collaborative Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Collaborative</span>
              <span className="text-rose-400 font-bold">{Math.round(weights.collaborative * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.collaborative}
              onChange={(e) => setWeights({ ...weights, collaborative: parseFloat(e.target.value) })}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Peer ratings & mean-centered user correlation</p>
          </div>

          {/* Content Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Content-Based</span>
              <span className="text-amber-400 font-bold">{Math.round(weights.content * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.content}
              onChange={(e) => setWeights({ ...weights, content: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">TF-IDF synopsis + metadata structure</p>
          </div>

          {/* Graph Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Graph Signals</span>
              <span className="text-emerald-400 font-bold">{Math.round(weights.graph * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.graph}
              onChange={(e) => setWeights({ ...weights, graph: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Shared directors, co-stars & multi-hop paths</p>
          </div>

          {/* Popularity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Popularity Baseline</span>
              <span className="text-cyan-400 font-bold">{Math.round(weights.popularity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.popularity}
              onChange={(e) => setWeights({ ...weights, popularity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Critical acclaim & global rating counts</p>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500 font-mono">
            Traversing Neo4j Graph & Computing Hybrid Vectors...
          </div>
        ) : recs.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl">
            <p className="text-slate-400 text-sm">No candidate movies match the chosen filter constraints.</p>
          </div>
        ) : (
          recs.map((item, idx) => (
            <div
              key={item.movie_id}
              className="glass-panel glass-panel-hover rounded-2xl p-6 border border-cine-border transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Poster Thumbnail + Rank Badge */}
                  <Link
                    to={`/movies/${item.movie_id}`}
                    className="relative w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden bg-[#16161f] border border-white/10 shrink-0 shadow-lg group block"
                  >
                    {getPosterUrl(item.movie_id) ? (
                      <img
                        src={getPosterUrl(item.movie_id)!}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-950 to-black font-black text-rose-400">
                        {item.title.charAt(0)}
                      </div>
                    )}
                    {/* Rank Badge Overlay */}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm font-mono font-bold text-[10px] text-rose-400 border border-white/10">
                      #{idx + 1}
                    </span>
                  </Link>

                  <div>
                    <Link to={`/movies/${item.movie_id}`} className="hover:text-[#e50914] transition-colors">
                      <h3 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                        {item.title}
                        <span className="text-xs font-mono text-slate-400 font-normal">
                          ({item.release_year})
                        </span>
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-400 mt-1">
                      Directed by <span className="text-amber-300 font-medium">{item.director}</span> • {item.genres.join(', ')} • {item.duration} mins
                    </p>
                    <p className="text-xs text-slate-300 mt-2 line-clamp-2 max-w-2xl">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Score & Rate Button */}
                <div className="flex items-center md:flex-col items-end gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-rose-400">
                      {Math.round(item.hybrid_score * 100)}%
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400 uppercase">
                      Hybrid Match
                    </span>
                  </div>

                  <button
                    onClick={() => setRatingMovieId(item.movie_id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rate</span>
                  </button>
                </div>
              </div>

              {/* Pillar 2: Verifiable Explanation Sentence */}
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs text-rose-200/90 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-rose-300 block mb-0.5 font-mono text-[11px] uppercase tracking-wider">
                    Verifiable Recommendation Signal
                  </span>
                  {item.explanation.sentence}
                </div>
              </div>

              {/* Score Breakdown Progress Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Collab</span>
                    <span>{Math.round((item.score_breakdown.collaborative / (weights.collaborative || 0.01)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((item.score_breakdown.collaborative / (weights.collaborative || 0.01)) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Content</span>
                    <span>{Math.round((item.score_breakdown.content / (weights.content || 0.01)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((item.score_breakdown.content / (weights.content || 0.01)) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Graph DNA</span>
                    <span>{Math.round((item.score_breakdown.graph / (weights.graph || 0.01)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((item.score_breakdown.graph / (weights.graph || 0.01)) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Popularity</span>
                    <span>{Math.round((item.score_breakdown.popularity / (weights.popularity || 0.01)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((item.score_breakdown.popularity / (weights.popularity || 0.01)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Traversal Paths */}
              {item.explanation.graph_paths?.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-slate-500">
                    <GitBranch className="w-3 h-3 text-slate-400" /> Path:
                  </span>
                  {item.explanation.graph_paths.map((p: string, pIdx: number) => (
                    <span key={pIdx} className="px-2 py-0.5 rounded bg-black/40 border border-white/5 truncate max-w-xl">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <RatingModal
        movieId={ratingMovieId}
        userId={currentUser}
        onClose={() => setRatingMovieId(null)}
        onSuccess={loadRecs}
      />
    </div>
  );
};
