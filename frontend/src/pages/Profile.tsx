import React, { useEffect, useState } from 'react';
import { User, Star, Eye, Bookmark, Calendar, Globe, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../api/client';

interface ProfileProps {
  currentUser: string;
}

export const Profile: React.FC<ProfileProps> = ({ currentUser }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchJson<any>(`/users/${currentUser}`)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (loading || !profile) {
    return <div className="text-center py-20 font-mono text-slate-400">Loading user profile...</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <section className="glass-panel p-8 rounded-3xl border border-cine-border relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-heading font-bold text-2xl text-white shadow-xl shadow-rose-950/40">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                  {profile.username}
                </h1>
                {profile.is_cold_start && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Cold Start User
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {profile.email} • {profile.country} • <strong className="text-rose-400">Age {profile.age}</strong> (derived from DOB {profile.user_dob})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-center">
              <span className="text-xl font-bold text-white block">{profile.ratings_count}</span>
              <span className="text-slate-400 uppercase text-[10px]">Ratings</span>
            </div>
            <div className="text-center">
              <span className="text-xl font-bold text-white block">{profile.watched_count}</span>
              <span className="text-slate-400 uppercase text-[10px]">Watched</span>
            </div>
            <div className="text-center">
              <span className="text-xl font-bold text-white block">{profile.watchlist_count}</span>
              <span className="text-slate-400 uppercase text-[10px]">Watchlist</span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Genres Affinity */}
      {profile.top_genres?.length > 0 && (
        <section className="glass-panel p-6 rounded-2xl border border-cine-border space-y-3">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            Favorite Genre Affinities (from RATED edges)
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {profile.top_genres.map((g: any) => (
              <span key={g.genre} className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-xs font-medium text-slate-200 flex items-center gap-2">
                <span>{g.genre}</span>
                <span className="text-rose-400 font-mono font-bold text-[11px]">{g.count} rated</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Rating History */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <h2 className="text-xl font-bold font-heading text-white">
            Rating History ({profile.ratings?.length || 0})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile.ratings?.map((r: any) => (
            <Link
              key={r.movie_id}
              to={`/movies/${r.movie_id}`}
              className="p-4 rounded-xl glass-panel glass-panel-hover border border-cine-border block space-y-1 transition-all"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-white truncate max-w-[200px]">{r.title}</span>
                <span className="font-mono text-amber-400 font-bold flex items-center gap-1 text-xs">
                  <Star className="w-3 h-3 fill-amber-400" /> {r.rating_value}★
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 block">Rated on {r.rating_date}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Watch History & Watchlist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold font-heading text-white">Watch History</h2>
          </div>
          <div className="space-y-2">
            {profile.watched?.map((w: any) => (
              <div key={w.movie_id} className="p-3.5 rounded-xl glass-panel border border-cine-border flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200">{w.title}</span>
                <span className="font-mono text-emerald-400 font-semibold">{w.completion_percentage}% completed</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-rose-400" />
            <h2 className="text-xl font-bold font-heading text-white">Watchlist</h2>
          </div>
          <div className="space-y-2">
            {profile.watchlist?.map((wl: any) => (
              <div key={wl.movie_id} className="p-3.5 rounded-xl glass-panel border border-cine-border flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200">{wl.title}</span>
                <span className="font-mono text-slate-500">Added {wl.added_date}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
