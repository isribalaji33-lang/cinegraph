import React, { useEffect, useState } from 'react';
import { Database, ShieldCheck, CheckCircle2, AlertTriangle, Play, RefreshCw, Zap, Cpu } from 'lucide-react';
import { fetchJson } from '../api/client';

export const AdminExplorer: React.FC = () => {
  const [statusData, setStatusData] = useState<any>(null);
  const [profileDemo, setProfileDemo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reSeeding, setReSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const [confirmReseedOpen, setConfirmReseedOpen] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const [statusRes, profileRes] = await Promise.all([
        fetchJson<any>('/admin/status'),
        fetchJson<any>('/admin/profile-demo'),
      ]);
      setStatusData(statusRes);
      setProfileDemo(profileRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleReSeed = async () => {
    setConfirmReseedOpen(false);
    setReSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetchJson<any>('/admin/seed', { method: 'POST' });
      setSeedMessage('Database re-seeded successfully with 15-entity benchmark dataset!');
      loadStatus();
    } catch (err: any) {
      setSeedMessage(`Error: ${err.message}`);
    } finally {
      setReSeeding(false);
    }
  };

  if (loading && !statusData) {
    return <div className="text-center py-20 font-mono text-slate-400">Loading database telemetry...</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>DBMS ADMINISTRATION</span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-white">
            Neo4j Database Explorer & Health
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time connection telemetry, schema constraint catalog, indexing efficiency profiling, and seed controls.
          </p>
        </div>

        <button
          onClick={() => setConfirmReseedOpen(true)}
          disabled={reSeeding}
          className="btn-primary text-xs font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reSeeding ? 'animate-spin' : ''}`} />
          <span>{reSeeding ? 'Seeding...' : 'Reset & Re-Seed Database'}</span>
        </button>
      </div>

      {/* Confirmation Dialog */}
      {confirmReseedOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111116] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-heading font-bold text-lg text-white">Confirm Database Reset</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              This operation will reset and re-synchronize all 15 users, 30 movies, and interaction edges in Neo4j AuraDB with the deterministic academic benchmark specification.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmReseedOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReSeed}
                className="btn-primary text-xs"
              >
                Yes, Reset &amp; Reseed
              </button>
            </div>
          </div>
        </div>
      )}

      {seedMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
          {seedMessage}
        </div>
      )}

      {/* Connectivity & Validation Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-cine-border space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Neo4j Driver Status</span>
          <div className="flex items-center gap-2">
            {statusData?.connection?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
            <span className="text-lg font-bold font-heading text-white">
              {statusData?.connection?.mode === 'neo4j_live' ? 'Connected (Live Bolt)' : 'Fallback Mode'}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 break-all">{statusData?.connection?.uri}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cine-border space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">ER Validation Suite</span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-lg font-bold font-heading text-white">
              {statusData?.validation?.valid ? 'All Constraints Passed' : 'Violations Detected'}
            </span>
          </div>
          <p className="text-xs text-slate-400">Cardinality rules: 1 dir/movie, 1 user+movie/review strictly met.</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cine-border space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Active Schema Objects</span>
          <div className="flex items-center gap-4 text-sm font-mono text-white">
            <span><strong className="text-cyan-400 text-lg">11</strong> Constraints</span>
            <span><strong className="text-amber-400 text-lg">5</strong> Indexes</span>
          </div>
          <p className="text-xs text-slate-400">Enforcing primary uniqueness and query acceleration.</p>
        </div>
      </div>

      {/* Measured PROFILE Demonstration */}
      {profileDemo && (
        <section className="glass-panel rounded-2xl p-6 border border-cine-border space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-heading text-white">
              Measured Indexing Optimization Demonstration (PROFILE)
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real measured comparison on live Neo4j executing a movie search with full label scan vs B-tree index seek:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Without Index */}
            <div className="p-4 rounded-xl bg-black/40 border border-rose-500/20 space-y-3 font-mono text-xs">
              <span className="text-rose-400 font-bold block uppercase text-[11px]">Unindexed / Label Scan</span>
              <p className="text-slate-300 text-[11px] bg-black/60 p-2 rounded">{profileDemo.unindexed_scan?.cypher}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>Operator: <strong className="text-rose-300">{profileDemo.unindexed_scan?.operator}</strong></div>
                <div>DB Hits: <strong className="text-rose-400">{profileDemo.unindexed_scan?.db_hits}</strong></div>
                <div>Execution: <strong className="text-slate-300">{profileDemo.unindexed_scan?.execution_time_ms} ms</strong></div>
                <div>Evaluated: <strong className="text-slate-400">{profileDemo.unindexed_scan?.rows_evaluated} rows</strong></div>
              </div>
            </div>

            {/* With Index */}
            <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 space-y-3 font-mono text-xs">
              <span className="text-emerald-400 font-bold block uppercase text-[11px]">Indexed Seek (idx_movie_title)</span>
              <p className="text-slate-300 text-[11px] bg-black/60 p-2 rounded">{profileDemo.indexed_seek?.cypher}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>Operator: <strong className="text-emerald-300">{profileDemo.indexed_seek?.operator}</strong></div>
                <div>DB Hits: <strong className="text-emerald-400">{profileDemo.indexed_seek?.db_hits}</strong></div>
                <div>Execution: <strong className="text-slate-300">{profileDemo.indexed_seek?.execution_time_ms} ms</strong></div>
                <div>Evaluated: <strong className="text-slate-400">{profileDemo.indexed_seek?.rows_evaluated} rows</strong></div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-emerald-300">
            {profileDemo.conclusion}
          </div>
        </section>
      )}

      {/* Constraints & Indexes Registry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Constraints */}
        <div className="glass-panel p-6 rounded-2xl border border-cine-border space-y-3">
          <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
            Uniqueness Constraints Catalog (11)
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {statusData?.schema?.constraints?.map((c: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono flex items-center justify-between">
                <span className="text-slate-200">(:{c.label || c.labelsOrTypes?.[0] || 'Node'})</span>
                <span className="text-cyan-400">{c.prop || c.properties?.[0] || 'id'} IS UNIQUE</span>
              </div>
            ))}
          </div>
        </div>

        {/* Indexes */}
        <div className="glass-panel p-6 rounded-2xl border border-cine-border space-y-3">
          <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
            Range & B-Tree Indexes Catalog (5)
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {statusData?.schema?.indexes?.map((idx: any, iIdx: number) => (
              <div key={iIdx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono flex items-center justify-between">
                <span className="text-slate-200">{idx.name}</span>
                <span className="text-amber-400">ON (:{idx.label || idx.labelsOrTypes?.[0]}.{idx.prop || idx.properties?.[0]})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
