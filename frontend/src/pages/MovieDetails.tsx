import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, Clock, Calendar, Globe, Award, ShieldCheck, Film, User,
  Eye, Bookmark, MessageSquare, ChevronLeft, Play, Database, Network,
} from 'lucide-react';
import { fetchJson } from '../api/client';
import { PosterCard } from '../components/PosterCard';
import { RatingModal } from '../components/RatingModal';

interface MovieDetailsProps { currentUser: string; }

const GENRE_COLORS: Record<string, string> = {
  'Sci-Fi': '#60c3ff', 'Action': '#ff6b6b', 'Drama': '#c084fc',
  'Thriller': '#f97316', 'Romance': '#fb7185', 'Crime': '#fbbf24',
  'Comedy': '#4ade80', 'Fantasy': '#818cf8', 'Animation': '#34d399',
  'Adventure': '#38bdf8', 'Horror': '#ef4444', 'Mystery': '#a78bfa',
};

export const MovieDetails: React.FC<MovieDetailsProps> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const loadDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchJson<any>(`/movies/${id}`);
      setMovie(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDetails(); }, [id]);

  const showFeedback = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleWatch = async () => {
    if (!id) return;
    try {
      await fetchJson(`/movies/${id}/watch`, {
        method: 'POST',
        body: JSON.stringify({ user_id: currentUser, movie_id: id, completion_percentage: 100 }),
      });
      showFeedback('WATCHED relationship created in Neo4j ✓', true);
    } catch (err: any) { showFeedback(err.message, false); }
  };

  const handleWatchlist = async () => {
    if (!id) return;
    try {
      await fetchJson(`/movies/${id}/watchlist`, {
        method: 'POST',
        body: JSON.stringify({ user_id: currentUser, movie_id: id }),
      });
      showFeedback('ADDED_TO_WATCHLIST relationship created in Neo4j ✓', true);
    } catch (err: any) { showFeedback(err.message, false); }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#e50914] border-t-transparent animate-spin" />
        <p className="text-[#5a5a6e] font-mono text-sm">Loading film metadata from Neo4j…</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="py-20 text-center space-y-3">
        <Film className="w-12 h-12 mx-auto text-[#5a5a6e]" />
        <p className="text-[#a3a3b3]">Movie not found.</p>
        <Link to="/" className="text-[#e50914] hover:underline text-sm">← Back to Discover</Link>
      </div>
    );
  }

  const primaryGenre = movie.genres?.[0] || '';
  const accentColor = GENRE_COLORS[primaryGenre] || '#e50914';
  const titleInitial = movie.title.charAt(0);

  return (
    <div className="space-y-10 pb-20 pt-4">

      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#5a5a6e] hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Discover
      </Link>

      {/* ── Hero Section ── */}
      <section className="relative rounded-2xl overflow-hidden border border-white/5" style={{ background: '#111118' }}>
        {/* Ambient BG */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(ellipse at 70% 50%, ${accentColor}40 0%, transparent 70%)` }}
        />

        <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Art */}
          <div
            className="relative w-44 sm:w-52 aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 shadow-2xl border border-white/8"
            style={{ background: `radial-gradient(ellipse at 60% 40%, ${accentColor}30 0%, #0a0a0f 80%)` }}
          >
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black font-heading select-none"
              style={{ fontSize: '5rem', color: accentColor, opacity: 0.8, textShadow: `0 0 60px ${accentColor}60` }}
            >
              {titleInitial}
            </span>
            {/* Rating badge */}
            {movie.avg_rating > 0 && (
              <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-mono font-bold text-amber-300">{movie.avg_rating}</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* Genres */}
            <div className="flex flex-wrap gap-1.5">
              {movie.genres?.map((g: string) => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                  style={{
                    color: GENRE_COLORS[g] || '#a3a3b3',
                    borderColor: `${GENRE_COLORS[g] || '#a3a3b3'}40`,
                    background: `${GENRE_COLORS[g] || '#a3a3b3'}10`,
                  }}
                >
                  {g}
                </span>
              ))}
              {movie.age_rating && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono border border-white/10 text-[#5a5a6e]">
                  {movie.age_rating}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-white leading-tight">
              {movie.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-sm font-mono text-[#a3a3b3]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" style={{ color: accentColor }} />
                {movie.release_year}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                {movie.duration} min
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#06b6d4]" />
                {movie.language}
              </span>
              {movie.rating_count > 0 && (
                <span className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {movie.avg_rating} / 5.0
                  <span className="font-normal text-[#5a5a6e]">({movie.rating_count} ratings)</span>
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-[#a3a3b3] leading-relaxed max-w-2xl">{movie.description}</p>

            {/* Director */}
            {movie.director?.director_name && (
              <p className="text-sm text-white">
                <span className="text-[#5a5a6e]">Directed by </span>
                <span className="font-semibold">{movie.director.director_name}</span>
                <span className="text-[#5a5a6e]"> · {movie.director.nationality}</span>
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => setShowRatingModal(true)} className="btn-primary">
                <Star className="w-4 h-4" /> Rate Film
              </button>
              <button onClick={handleWatch} className="btn-secondary">
                <Eye className="w-4 h-4" /> Mark Watched
              </button>
              <button onClick={handleWatchlist} className="btn-secondary">
                <Bookmark className="w-4 h-4" /> + Watchlist
              </button>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={`text-xs font-mono px-3 py-1.5 rounded-lg border ${
                feedback.ok
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/30 text-red-300'
              }`}>
                {feedback.msg}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Metadata Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cast */}
        <div className="rounded-xl border border-white/5 p-4 space-y-3" style={{ background: '#16161f' }}>
          <p className="section-label flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Key Cast</p>
          <div className="space-y-1.5">
            {movie.actors?.map((a: any) => (
              <div key={a.actor_id} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0">
                  {a.actor_name?.[0]}
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{a.actor_name}</p>
                  <p className="text-[10px] text-[#5a5a6e]">{a.actor_nationality}</p>
                </div>
              </div>
            ))}
            {!movie.actors?.length && <p className="text-xs text-[#5a5a6e]">No cast data</p>}
          </div>
        </div>

        {/* Studios */}
        <div className="rounded-xl border border-white/5 p-4 space-y-3" style={{ background: '#16161f' }}>
          <p className="section-label flex items-center gap-1.5"><Film className="w-3.5 h-3.5" /> Studios</p>
          <div className="space-y-1.5">
            {movie.studios?.map((s: any) => (
              <div key={s.studio_id}>
                <p className="text-xs font-medium text-white">{s.studio_name}</p>
                <p className="text-[10px] text-[#5a5a6e]">{s.country}</p>
              </div>
            ))}
            {!movie.studios?.length && <p className="text-xs text-[#5a5a6e]">No studio data</p>}
          </div>
        </div>

        {/* Awards */}
        <div className="rounded-xl border border-white/5 p-4 space-y-3" style={{ background: '#16161f' }}>
          <p className="section-label flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-400" /> Awards</p>
          <div className="space-y-1.5">
            {movie.awards?.length === 0 && <p className="text-xs text-[#5a5a6e] italic">No recorded awards</p>}
            {movie.awards?.map((aw: any, idx: number) => (
              <div key={idx}>
                <p className="text-xs font-medium text-amber-300">{aw.award_name}</p>
                <p className="text-[10px] text-[#5a5a6e]">{aw.year} · <span className={aw.result === 'Won' ? 'text-emerald-400' : 'text-[#5a5a6e]'}>{aw.result}</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="rounded-xl border border-white/5 p-4 space-y-3" style={{ background: '#16161f' }}>
          <p className="section-label flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400" /> Ratings</p>
          <div className="space-y-2 pt-1">
            {['5', '4', '3', '2', '1'].map(star => {
              const count = movie.rating_distribution?.[star] || 0;
              const pct = movie.rating_count ? Math.round((count / movie.rating_count) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-5 text-[#5a5a6e] font-mono">{star}★</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-5 text-right text-[#5a5a6e] font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Reviews ── */}
      <section className="rounded-xl border border-white/5 p-5 space-y-4" style={{ background: '#16161f' }}>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#e50914]" />
          <h2 className="font-heading font-bold text-white">Community Reviews</h2>
          <span className="badge badge-red ml-auto">WROTE · ABOUT traversal</span>
        </div>
        {movie.reviews?.length === 0 ? (
          <p className="text-xs text-[#5a5a6e] italic">No written reviews yet for this film.</p>
        ) : (
          <div className="space-y-3">
            {movie.reviews?.map((r: any, rIdx: number) => (
              <div key={rIdx} className="p-4 rounded-xl bg-white/3 border border-white/4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: accentColor }}>
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-600 to-amber-500 flex items-center justify-center text-[9px] text-white font-bold">
                      {r.username?.[0]?.toUpperCase()}
                    </div>
                    @{r.username}
                  </span>
                  <span className="text-xs font-mono text-[#5a5a6e]">{r.review_date}</span>
                </div>
                <p className="text-sm text-[#a3a3b3] leading-relaxed italic">"{r.review_text}"</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Similar Movies ── */}
      {movie.similar_movies?.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-[#06b6d4]" />
            <h2 className="text-xl font-bold font-heading text-white">Similar Films in the Graph</h2>
          </div>
          <div className="scroll-row pb-2">
            {movie.similar_movies.map((sim: any) => (
              <Link
                key={sim.movie_id}
                to={`/movies/${sim.movie_id}`}
                className="flex-shrink-0 w-36 group"
              >
                <div className="rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all hover:-translate-y-1">
                  <div
                    className="w-full aspect-[2/3] flex items-center justify-center font-black font-heading text-4xl"
                    style={{
                      background: `radial-gradient(ellipse at 50% 40%, ${accentColor}30 0%, #0a0a0f 80%)`,
                      color: accentColor,
                      opacity: 0.9,
                    }}
                  >
                    {sim.title.charAt(0)}
                  </div>
                  <div className="p-2 bg-[#16161f]">
                    <p className="text-xs font-bold text-white line-clamp-1">{sim.title}</p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: accentColor }}>
                      Sim {Math.round(sim.similarity_score * 100)}%
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <RatingModal
        movieId={showRatingModal ? movie.movie_id : null}
        userId={currentUser}
        onClose={() => setShowRatingModal(false)}
        onSuccess={loadDetails}
      />
    </div>
  );
};
