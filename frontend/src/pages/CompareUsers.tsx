import React, { useEffect, useState } from 'react';
import { Scale, ArrowUpDown, PlusCircle, MinusCircle, Star, Sparkles, Check, ArrowRight } from 'lucide-react';
import { fetchJson } from '../api/client';

export const CompareUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [user1Id, setUser1Id] = useState('u01');
  const [user2Id, setUser2Id] = useState('u02');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // What-If Simulator State
  const [movies, setMovies] = useState<any[]>([]);
  const [simUserId, setSimUserId] = useState('u01');
  const [simMovieId, setSimMovieId] = useState('m15'); // Saving Private Ryan
  const [simRating, setSimRating] = useState(5.0);
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchJson<any[]>('/users'),
      fetchJson<any[]>('/movies'),
    ]).then(([uData, mData]) => {
      setUsers(uData);
      setMovies(mData);
    }).catch(console.error);
  }, []);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const data = await fetchJson<any>(`/recommendations/compare?user1_id=${user1Id}&user2_id=${user2Id}`);
      setComparisonData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison();
  }, [user1Id, user2Id]);

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const res = await fetchJson<any>('/recommendations/what-if', {
        method: 'POST',
        body: JSON.stringify({
          user_id: simUserId,
          movie_id: simMovieId,
          new_rating: simRating,
        }),
      });
      setSimResult(res);
      // Refresh comparison if current user matches
      loadComparison();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-2">
          <Scale className="w-3.5 h-3.5" />
          <span>PILLAR 3: PROVE THE ML WORKS</span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-white">
          Compare Users & What-If Simulation
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Observe distinct graph taste clusters side by side. Test live rating interventions and watch recommendations re-rank with detailed rank shift diffs.
        </p>
      </div>

      {/* Part 1: Side-by-Side User Comparison */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-cine-border">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-mono text-slate-400">User A:</span>
            <select
              value={user1Id}
              onChange={(e) => setUser1Id(e.target.value)}
              className="bg-cine-card border border-cine-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.username} ({u.country})
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-mono text-rose-400 font-bold px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/30">
            {comparisonData?.taste_divergence_metrics?.jaccard_divergence !== undefined && (
              <span>Divergence: {comparisonData.taste_divergence_metrics.jaccard_divergence * 100}%</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-xs font-mono text-slate-400">User B:</span>
            <select
              value={user2Id}
              onChange={(e) => setUser2Id(e.target.value)}
              className="bg-cine-card border border-cine-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.username} ({u.country})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Side-by-Side Cards */}
        {comparisonData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User 1 Column */}
            <div className="glass-panel rounded-2xl p-6 border border-cine-border space-y-4">
              <div className="border-b border-white/5 pb-3">
                <span className="text-xs font-mono text-rose-400 font-semibold block">USER 1 PROFILE</span>
                <h3 className="text-xl font-bold font-heading text-white">{comparisonData.user1.username}</h3>
                <p className="text-xs text-slate-400">{comparisonData.user1.country} • Age {comparisonData.user1.age ?? 30}</p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Top Recommendations (Taste Cluster A)
                </span>
                {comparisonData.user1_recommendations?.map((item: any, idx: number) => (
                  <div key={item.movie_id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-white">#{idx + 1} {item.title}</span>
                      <span className="font-mono text-xs text-rose-400 font-bold">{Math.round(item.hybrid_score * 100)}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.genres?.join(', ')} • Dir. {item.director}</p>
                    <p className="text-[11px] text-rose-300/80 italic line-clamp-1">{item.explanation?.sentence}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* User 2 Column */}
            <div className="glass-panel rounded-2xl p-6 border border-cine-border space-y-4">
              <div className="border-b border-white/5 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-semibold block">USER 2 PROFILE</span>
                <h3 className="text-xl font-bold font-heading text-white">{comparisonData.user2.username}</h3>
                <p className="text-xs text-slate-400">{comparisonData.user2.country} • Age {comparisonData.user2.age ?? 27}</p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Top Recommendations (Taste Cluster B)
                </span>
                {comparisonData.user2_recommendations?.map((item: any, idx: number) => (
                  <div key={item.movie_id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-white">#{idx + 1} {item.title}</span>
                      <span className="font-mono text-xs text-cyan-400 font-bold">{Math.round(item.hybrid_score * 100)}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.genres?.join(', ')} • Dir. {item.director}</p>
                    <p className="text-[11px] text-cyan-300/80 italic line-clamp-1">{item.explanation?.sentence}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Part 2: Live What-If Rating Simulator */}
      <section className="glass-panel rounded-2xl p-6 border border-cine-border space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold font-heading text-white">
            Live What-If Rating Simulation
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-3xl">
          Simulate user taste evolution in real time. Rate a movie as a selected user, persist the new edge directly to Neo4j, and inspect how recommendations and candidate rankings immediately shift before vs after.
        </p>

        <form onSubmit={handleRunSimulation} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-black/40 p-4 rounded-xl border border-white/5">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Target User</label>
            <select
              value={simUserId}
              onChange={(e) => setSimUserId(e.target.value)}
              className="w-full bg-cine-card border border-cine-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>{u.username}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Select Film to Rate</label>
            <select
              value={simMovieId}
              onChange={(e) => setSimMovieId(e.target.value)}
              className="w-full bg-cine-card border border-cine-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              {movies.map((m) => (
                <option key={m.movie_id} value={m.movie_id}>{m.title} ({m.release_year})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">New Rating: {simRating.toFixed(1)} ★</label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={simRating}
              onChange={(e) => setSimRating(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={simulating}
            className="w-full py-2.5 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {simulating ? 'Simulating...' : 'Simulate & Re-rank Live'}
          </button>
        </form>

        {/* Diff Results Table */}
        {simResult && (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs font-mono text-amber-300">
              {simResult.diff_analysis?.summary}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rank Shifts */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Rank Movements
                </span>
                <div className="space-y-2">
                  {simResult.diff_analysis?.rank_shifts?.map((shift: any) => (
                    <div key={shift.movie_id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white block">{shift.title}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          Rank #{shift.old_rank} → #{shift.new_rank}
                        </span>
                      </div>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                        shift.shift > 0 ? 'bg-emerald-500/20 text-emerald-300' : shift.shift < 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-slate-300'
                      }`}>
                        {shift.shift > 0 ? `▲ +${shift.shift}` : shift.shift < 0 ? `▼ ${shift.shift}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* New & Departed Entries */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5" /> New Entries to Top 10
                  </span>
                  {simResult.diff_analysis?.new_entries?.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono">No new movies entered top 10.</p>
                  ) : (
                    simResult.diff_analysis?.new_entries?.map((item: any) => (
                      <div key={item.movie_id} className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs flex justify-between">
                        <span className="text-emerald-200 font-medium">{item.title}</span>
                        <span className="font-mono text-emerald-400 font-bold">New Rank #{item.new_rank}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-rose-400 uppercase tracking-wider block flex items-center gap-1">
                    <MinusCircle className="w-3.5 h-3.5" /> Dropped Out of Top 10
                  </span>
                  {simResult.diff_analysis?.dropped_entries?.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono">No movies dropped out of top 10.</p>
                  ) : (
                    simResult.diff_analysis?.dropped_entries?.map((item: any) => (
                      <div key={item.movie_id} className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs flex justify-between">
                        <span className="text-rose-200 font-medium">{item.title}</span>
                        <span className="font-mono text-rose-400 font-bold">Was Rank #{item.old_rank}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
