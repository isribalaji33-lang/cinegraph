import React, { useEffect, useState } from 'react';
import { BarChart3, Users, Film, Award, TrendingUp, Sparkles, Clapperboard } from 'lucide-react';
import { fetchJson } from '../api/client';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<any>('/analytics/overview').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="text-center py-20 font-mono text-slate-400">Loading graph analytics...</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-2">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>GRAPH DATABASE ANALYTICS</span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-white">
          Graph Intelligence & Catalog Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          High-level aggregate statistics, co-starring network frequency, and director ratings directly from Cypher traversals.
        </p>
      </div>

      {/* Node Totals Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(data.node_counts || {}).map(([label, count]: any) => (
          <div key={label} className="glass-panel p-3.5 rounded-xl border border-cine-border text-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">{label}</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">{count}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Frequent Co-Starring Pairs */}
        <div className="glass-panel p-6 rounded-2xl border border-cine-border space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="font-heading font-bold text-base text-white">
              Frequent Co-starring Collaborators
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Actors repeatedly connected through shared <code className="text-emerald-400 font-mono">[:ACTED_IN]</code> movie bridges:
          </p>

          <div className="space-y-3">
            {data.co_stars?.map((pair: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">
                    {pair.actor_1} & {pair.actor_2}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px]">
                    {pair.shared_movies} Films Together
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {pair.titles?.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Director Performance Rankings */}
        <div className="glass-panel p-6 rounded-2xl border border-cine-border space-y-4">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-amber-400" />
            <h3 className="font-heading font-bold text-base text-white">
              Director Performance & Auteur Rankings
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Average rating across all directed films with at least 15 ratings:
          </p>

          <div className="space-y-3">
            {data.top_directors?.map((dir: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">#{idx + 1} {dir.director_name}</span>
                  <span className="text-[11px] text-slate-400">{dir.nationality} • {dir.sample_film}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-amber-400">{dir.avg_rating} ★</span>
                  <span className="block text-[10px] text-slate-500">{dir.movies_count} movies</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
