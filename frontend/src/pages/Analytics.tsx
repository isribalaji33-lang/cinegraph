import React, { useEffect, useState } from 'react';
import {
  BarChart3, Users, Film, Award, TrendingUp, Clapperboard,
  Network, Star, Share2, Activity, Database,
} from 'lucide-react';
import { fetchJson } from '../api/client';

const NODE_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  Movies:    { icon: <Film className="w-5 h-5" />,       color: '#e50914' },
  Users:     { icon: <Users className="w-5 h-5" />,      color: '#8b5cf6' },
  Directors: { icon: <Clapperboard className="w-5 h-5" />, color: '#f5c518' },
  Actors:    { icon: <Activity className="w-5 h-5" />,   color: '#10b981' },
  Genres:    { icon: <BarChart3 className="w-5 h-5" />,  color: '#06b6d4' },
  Studios:   { icon: <Share2 className="w-5 h-5" />,     color: '#6366f1' },
  Reviews:   { icon: <Star className="w-5 h-5" />,       color: '#ec4899' },
};

const REL_COLORS: Record<string, string> = {
  RATED:     '#e50914',
  WATCHED:   '#10b981',
  ACTED_IN:  '#10b981',
  DIRECTED_BY: '#f5c518',
  HAS_GENRE: '#06b6d4',
  WATCHLIST: '#8b5cf6',
  WROTE:     '#ec4899',
};

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div
      className="relative rounded-xl p-4 border overflow-hidden group hover:-translate-y-0.5 transition-transform"
      style={{ background: '#16161f', borderColor: `${color}25` }}
    >
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40"
           style={{ background: color, transform: 'translate(30%, -30%)' }} />
      <div style={{ color }} className="mb-2">{icon}</div>
      <p className="text-2xl font-black font-heading text-white">{(value || 0).toLocaleString()}</p>
      <p className="text-xs text-[#5a5a6e] uppercase tracking-wider mt-0.5 font-mono">{label}</p>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 truncate text-[#a3a3b3] text-xs" title={label}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color || '#e50914' }}
        />
      </div>
      <span className="w-8 text-right text-xs font-mono text-[#5a5a6e]">{value}</span>
    </div>
  );
}

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<any>('/analytics/overview').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#e50914] border-t-transparent animate-spin" />
        <p className="text-[#5a5a6e] font-mono text-sm">Querying Neo4j graph analytics…</p>
      </div>
    );
  }

  const nc = data?.node_counts || {};
  const rc = data?.relationship_counts || {};
  const maxGenreCount = Math.max(...(data?.top_genres || []).map((g: any) => g.movie_count), 1);
  const maxRelCount = Math.max(...Object.values(rc).map(Number), 1);

  return (
    <div className="space-y-10 pb-20 pt-4">

      {/* ── Page Header ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="badge badge-red"><Database className="w-3 h-3" /> Live Neo4j</span>
          <span className="badge badge-blue"><Network className="w-3 h-3" /> Graph Analytics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-heading text-white">
          Graph Intelligence &amp; Catalog Analytics
        </h1>
        <p className="text-sm text-[#a3a3b3] max-w-2xl">
          All metrics computed live from Neo4j Cypher traversals — no static data.
        </p>
      </div>

      {/* ── Node Count Cards ── */}
      <section>
        <p className="section-label mb-3">Graph Nodes — Live Counts</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {Object.entries(nc).map(([label, count]: any) => {
            const cfg = NODE_ICONS[label] || { icon: <Database className="w-5 h-5" />, color: '#64748b' };
            return <StatCard key={label} label={label} value={count} icon={cfg.icon} color={cfg.color} />;
          })}
        </div>
      </section>

      {/* ── Relationship Counts ── */}
      {Object.keys(rc).length > 0 && (
        <section className="rounded-xl border border-white/5 p-5" style={{ background: '#16161f' }}>
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-4 h-4 text-[#018bff]" />
            <h2 className="font-heading font-bold text-white">Relationship Counts</h2>
            <span className="badge badge-blue ml-auto">Live Cypher</span>
          </div>
          <div className="space-y-3">
            {Object.entries(rc).map(([rel, count]: any) => (
              <BarRow key={rel} label={rel} value={count} max={maxRelCount} color={REL_COLORS[rel] || '#64748b'} />
            ))}
          </div>
        </section>
      )}

      {/* ── Two Column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Co-starring Pairs */}
        <section className="rounded-xl border border-white/5 p-5 space-y-4" style={{ background: '#16161f' }}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#10b981]" />
            <h2 className="font-heading font-bold text-white">Frequent Co-starring Pairs</h2>
          </div>
          <p className="text-xs text-[#5a5a6e]">
            Actors sharing <code className="text-[#10b981] font-mono">[:ACTED_IN]</code> on 2+ movies:
          </p>
          <div className="space-y-3">
            {data?.co_stars?.length === 0 && (
              <p className="text-xs text-[#5a5a6e] italic">No co-starring pairs with ≥2 shared films yet.</p>
            )}
            {data?.co_stars?.map((pair: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-white/3 border border-white/4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{pair.actor_1} &amp; {pair.actor_2}</span>
                  <span className="badge badge-green">{pair.shared_movies} Films</span>
                </div>
                <p className="text-xs text-[#5a5a6e] font-mono leading-relaxed">
                  {pair.titles?.join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Director Rankings */}
        <section className="rounded-xl border border-white/5 p-5 space-y-4" style={{ background: '#16161f' }}>
          <div className="flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-amber-400" />
            <h2 className="font-heading font-bold text-white">Director Rankings</h2>
          </div>
          <p className="text-xs text-[#5a5a6e]">
            Ranked by average <code className="text-amber-400 font-mono">[:RATED]</code> score across directed films:
          </p>
          <div className="space-y-2">
            {data?.top_directors?.map((dir: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/4">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                  style={{ background: idx === 0 ? '#f5c518' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7c2e' : '#1e1e2a', color: idx < 3 ? '#000' : '#a3a3b3' }}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{dir.director_name}</p>
                  <p className="text-[11px] text-[#5a5a6e] truncate">{dir.nationality} · {dir.sample_film}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-bold text-amber-400 text-sm">{dir.avg_rating > 0 ? `${dir.avg_rating} ★` : '—'}</p>
                  <p className="text-[10px] text-[#5a5a6e]">{dir.movies_count} films</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Genre Distribution ── */}
      {data?.top_genres?.length > 0 && (
        <section className="rounded-xl border border-white/5 p-5 space-y-4" style={{ background: '#16161f' }}>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#06b6d4]" />
            <h2 className="font-heading font-bold text-white">Genre Distribution</h2>
            <span className="badge badge-blue ml-auto">HAS_GENRE traversal</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.top_genres.map((g: any) => (
              <BarRow key={g.genre} label={g.genre} value={g.movie_count} max={maxGenreCount} color="#06b6d4" />
            ))}
          </div>
        </section>
      )}

      {/* ── Highest Rated Movies ── */}
      {data?.highest_rated_movies?.length > 0 && (
        <section className="rounded-xl border border-white/5 p-5 space-y-4" style={{ background: '#16161f' }}>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h2 className="font-heading font-bold text-white">Highest Rated Films</h2>
            <span className="text-xs text-[#5a5a6e] ml-2">Min. 3 ratings required</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.highest_rated_movies.map((m: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-white/3 border border-white/4 flex items-center gap-3">
                <span
                  className="text-xl font-black font-heading flex-shrink-0 w-8"
                  style={{ color: idx === 0 ? '#f5c518' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7c2e' : '#5a5a6e' }}
                >
                  #{idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{m.title}</p>
                  <p className="text-[11px] text-[#5a5a6e] truncate">{m.director} · {m.year}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-amber-400 font-mono font-bold">{m.avg_rating} ★</p>
                  <p className="text-[10px] text-[#5a5a6e]">{m.ratings_count} votes</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
