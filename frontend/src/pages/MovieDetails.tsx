import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Clock, Calendar, Globe, Award, ShieldCheck, Film, User, Eye, Bookmark, MessageSquare } from 'lucide-react';
import { fetchJson } from '../api/client';
import { PosterCard } from '../components/PosterCard';
import { RatingModal } from '../components/RatingModal';

interface MovieDetailsProps {
  currentUser: string;
}

export const MovieDetails: React.FC<MovieDetailsProps> = ({ currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

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

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleWatch = async () => {
    if (!id) return;
    try {
      await fetchJson(`/movies/${id}/watch`, {
        method: 'POST',
        body: JSON.stringify({ user_id: currentUser, movie_id: id, completion_percentage: 100 }),
      });
      setFeedback('Marked as watched in Neo4j!');
      setTimeout(() => setFeedback(null), 2500);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  const handleWatchlist = async () => {
    if (!id) return;
    try {
      await fetchJson(`/movies/${id}/watchlist`, {
        method: 'POST',
        body: JSON.stringify({ user_id: currentUser, movie_id: id }),
      });
      setFeedback('Added to watchlist in Neo4j!');
      setTimeout(() => setFeedback(null), 2500);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="text-center py-20 font-mono text-slate-400">Loading film metadata...</div>;
  }

  if (!movie) {
    return <div className="text-center py-20 text-slate-400">Movie not found.</div>;
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Backdrop & Header Banner */}
      <section className="relative rounded-3xl glass-panel p-8 sm:p-12 border border-cine-border overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Card Initial Poster */}
          <div className="w-full md:w-56 aspect-[2/3] rounded-2xl bg-gradient-to-tr from-slate-900 to-rose-950 border border-white/10 flex flex-col items-center justify-center p-6 text-center shadow-2xl shrink-0">
            <span className="text-7xl font-bold font-heading text-rose-500/30 mb-2">
              {movie.title.charAt(0)}
            </span>
            <span className="font-heading font-bold text-lg text-white line-clamp-2">
              {movie.title}
            </span>
            <span className="text-xs font-mono text-slate-400 mt-1">{movie.release_year}</span>
          </div>

          {/* Details Column */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {movie.genres?.map((g: string) => (
                <span key={g} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-600/20 text-rose-300 border border-rose-500/30">
                  {g}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-white/10 text-slate-300">
                {movie.age_rating}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-400" /> {movie.release_year}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> {movie.duration} mins
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" /> {movie.language}
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" /> {movie.avg_rating} / 5.0 ({movie.rating_count} ratings)
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {movie.description}
            </p>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowRatingModal(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 flex items-center gap-2 transition-all"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>Rate Film</span>
              </button>

              <button
                onClick={handleWatch}
                className="px-4 py-2.5 rounded-xl text-xs font-mono font-medium bg-cine-card border border-cine-border hover:bg-cine-hover text-slate-200 flex items-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Mark Watched</span>
              </button>

              <button
                onClick={handleWatchlist}
                className="px-4 py-2.5 rounded-xl text-xs font-mono font-medium bg-cine-card border border-cine-border hover:bg-cine-hover text-slate-200 flex items-center gap-2 transition-colors"
              >
                <Bookmark className="w-4 h-4 text-rose-400" />
                <span>Add to Watchlist</span>
              </button>
            </div>

            {feedback && (
              <p className="text-xs font-mono text-emerald-400 animate-in fade-in">{feedback}</p>
            )}
          </div>
        </div>
      </section>

      {/* Cast, Director, Studio, Awards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Director */}
        <div className="glass-panel p-5 rounded-2xl border border-cine-border space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Directed By</span>
          <h3 className="font-heading font-bold text-base text-white">{movie.director?.director_name}</h3>
          <p className="text-xs text-slate-400">{movie.director?.nationality} • Born {movie.director?.director_dob}</p>
        </div>

        {/* Cast */}
        <div className="glass-panel p-5 rounded-2xl border border-cine-border space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Key Cast</span>
          <div className="space-y-1">
            {movie.actors?.map((a: any) => (
              <div key={a.actor_id} className="text-xs text-slate-200 font-medium">
                {a.actor_name} <span className="text-slate-500 font-normal">({a.actor_nationality})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Studios */}
        <div className="glass-panel p-5 rounded-2xl border border-cine-border space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Production Studios</span>
          <div className="space-y-1">
            {movie.studios?.map((s: any) => (
              <div key={s.studio_id} className="text-xs text-slate-200 font-medium">
                {s.studio_name} <span className="text-slate-500 font-normal">({s.country})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Awards */}
        <div className="glass-panel p-5 rounded-2xl border border-cine-border space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Awards & Honors
          </span>
          <div className="space-y-1.5">
            {movie.awards?.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No recorded awards</span>
            ) : (
              movie.awards?.map((aw: any, idx: number) => (
                <div key={idx} className="text-xs text-amber-300/90 font-medium leading-tight">
                  {aw.award_name} ({aw.year}) • <span className="text-emerald-400">{aw.result}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Reviews & Rating Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-cine-border space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-rose-400" />
            <h3 className="font-heading font-bold text-base text-white">Community Reviews</h3>
          </div>

          <div className="space-y-3">
            {movie.reviews?.length === 0 ? (
              <p className="text-xs text-slate-500">No written reviews yet for this movie.</p>
            ) : (
              movie.reviews?.map((r: any, rIdx: number) => (
                <div key={rIdx} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-300">@{r.username}</span>
                    <span className="font-mono text-slate-500">{r.review_date}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{r.review_text}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="glass-panel p-6 rounded-2xl border border-cine-border space-y-3">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            Rating Distribution (1-5★)
          </span>
          <div className="space-y-2 pt-2">
            {['5', '4', '3', '2', '1'].map((star) => {
              const count = movie.rating_distribution?.[star] || 0;
              const pct = movie.rating_count ? Math.round((count / movie.rating_count) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-6 text-slate-400">{star}★</span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Similar Movies */}
      {movie.similar_movies?.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-heading text-white">
            Similar Films in the Graph
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {movie.similar_movies.map((sim: any) => (
              <Link
                key={sim.movie_id}
                to={`/movies/${sim.movie_id}`}
                className="p-3 rounded-xl glass-panel glass-panel-hover border border-cine-border text-center space-y-1 block"
              >
                <div className="w-full aspect-[2/3] rounded-lg bg-gradient-to-tr from-slate-900 to-rose-950/60 flex items-center justify-center font-heading font-bold text-xl text-white/30">
                  {sim.title.charAt(0)}
                </div>
                <h4 className="font-heading font-bold text-xs text-white truncate">{sim.title}</h4>
                <span className="text-[10px] font-mono text-rose-400 block">
                  Sim {Math.round(sim.similarity_score * 100)}%
                </span>
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
