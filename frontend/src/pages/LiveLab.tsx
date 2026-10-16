import React, { useEffect, useState, useRef, useCallback } from 'react';
import cytoscape from 'cytoscape';
import {
  Network, Play, Terminal, Cpu, Database, Eye, ChevronRight,
  GitFork, AlertCircle, RefreshCw, Sparkles, User, CheckCircle2,
  BookmarkPlus, Star, ArrowRight, Zap
} from 'lucide-react';
import { fetchJson } from '../api/client';

interface CuratedQuery {
  id: string;
  title: string;
  description: string;
  path_pattern: string;
  cypher: string;
  traversal_hops: Array<{ hop: number; from: string; rel: string; to: string }>;
  default_params: Record<string, any>;
}

interface UserSummary {
  user_id: string;
  username: string;
  email: string;
  country: string;
}

interface LiveLabProps {
  currentUser?: string | null;
}

export const LiveLab: React.FC<LiveLabProps> = ({ currentUser }) => {
  const [curatedQueries, setCuratedQueries] = useState<CuratedQuery[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string>('');
  const [cypherText, setCypherText] = useState<string>('');
  const [paramsText, setParamsText] = useState<string>('{}');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'graph'>('table');
  const [activeHopIndex, setActiveHopIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutationSuccess, setMutationSuccess] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  // Available users for switching in Live Lab
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>(currentUser || 'u01');

  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);

  // Synchronize activeUserId if parent currentUser changes
  useEffect(() => {
    if (currentUser) {
      setActiveUserId(currentUser);
    }
  }, [currentUser]);

  // Fetch users list
  useEffect(() => {
    fetchJson<UserSummary[]>('/users')
      .then((data) => setUsers(data || []))
      .catch(console.error);
  }, []);

  const runCypher = useCallback(async (cypher: string, paramsObj: any, queryId?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchJson<any>('/lab/execute', {
        method: 'POST',
        body: JSON.stringify({
          query_id: queryId || undefined,
          cypher: cypher,
          params: paramsObj,
        }),
      });
      setExecutionResult(res);
      setActiveHopIndex(0);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to execute Cypher query');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectCurated = useCallback((q: CuratedQuery, uid: string) => {
    setSelectedQueryId(q.id);
    setCypherText(q.cypher);
    const updatedParams = { ...q.default_params };
    if ('user_id' in updatedParams) {
      updatedParams.user_id = uid;
    }
    const paramsStr = JSON.stringify(updatedParams, null, 2);
    setParamsText(paramsStr);
    setErrorMessage(null);
    // Automatically execute the query so the table is never blank/stagnant
    runCypher(q.cypher, updatedParams, q.id);
  }, [runCypher]);

  // Fetch curated queries on mount
  useEffect(() => {
    fetchJson<CuratedQuery[]>('/lab/curated')
      .then((data) => {
        setCuratedQueries(data || []);
        if (data && data.length > 0) {
          selectCurated(data[0], activeUserId);
        }
      })
      .catch(console.error);
  }, [selectCurated, activeUserId]);

  const handleExecute = async () => {
    let parsedParams = {};
    try {
      parsedParams = JSON.parse(paramsText);
    } catch (e) {
      setErrorMessage('Invalid JSON format in parameters editor.');
      return;
    }
    await runCypher(cypherText, parsedParams, selectedQueryId || undefined);
  };

  const handleUserChange = (newUid: string) => {
    setActiveUserId(newUid);
    try {
      const curParams = JSON.parse(paramsText);
      if ('user_id' in curParams) {
        curParams.user_id = newUid;
        setParamsText(JSON.stringify(curParams, null, 2));
        runCypher(cypherText, curParams, selectedQueryId || undefined);
      } else {
        runCypher(cypherText, curParams, selectedQueryId || undefined);
      }
    } catch {
      runCypher(cypherText, { user_id: newUid }, selectedQueryId || undefined);
    }
  };

  // Perform a 1-click live mutation into Neo4j and immediately refresh the query
  const performLiveMutation = async (type: 'rate' | 'watchlist', movieId: string, movieTitle: string, ratingValue?: number) => {
    setMutating(true);
    setMutationSuccess(null);
    try {
      if (type === 'rate') {
        await fetchJson(`/movies/${movieId}/rate`, {
          method: 'POST',
          body: JSON.stringify({
            user_id: activeUserId,
            rating_value: ratingValue ?? 5.0,
          }),
        });
        setMutationSuccess(`✓ Neo4j Updated: Rated "${movieTitle}" ${ratingValue}★ for user ${activeUserId}!`);
      } else {
        await fetchJson(`/movies/${movieId}/watchlist`, {
          method: 'POST',
          body: JSON.stringify({
            user_id: activeUserId,
          }),
        });
        setMutationSuccess(`✓ Neo4j Updated: Added "${movieTitle}" to Watchlist for user ${activeUserId}!`);
      }

      // Re-run the active query immediately so the table updates live
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(paramsText);
      } catch {
        parsedParams = { user_id: activeUserId };
      }
      await runCypher(cypherText, parsedParams, selectedQueryId || undefined);
    } catch (err: any) {
      setErrorMessage(`Mutation error: ${err.message}`);
    } finally {
      setMutating(false);
    }
  };

  // Render Cytoscape graph when elements change or tab switches
  useEffect(() => {
    if (activeTab === 'graph' && cyRef.current && executionResult?.graph_elements) {
      const elements = [
        ...executionResult.graph_elements.nodes,
        ...executionResult.graph_elements.edges,
      ];

      if (cyInstance.current) {
        cyInstance.current.destroy();
      }

      cyInstance.current = cytoscape({
        container: cyRef.current,
        elements: elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              'label': 'data(label)',
              'color': '#f8fafc',
              'font-size': '11px',
              'font-family': 'Inter, sans-serif',
              'text-valign': 'bottom',
              'text-margin-y': 5,
              'width': 34,
              'height': 34,
              'border-width': 2,
              'border-color': '#ffffff22',
            },
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#e11d4888',
              'target-arrow-color': '#e11d48',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '9px',
              'color': '#94a3b8',
              'text-rotation': 'autorotate',
            },
          },
        ],
        layout: {
          name: 'cose',
          animate: true,
          padding: 30,
        },
      });
    }
  }, [executionResult, activeTab]);

  const activeUserObj = users.find((u) => u.user_id === activeUserId);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 mb-2">
          <Terminal className="w-3.5 h-3.5" />
          <span>PILLAR 1: NEO4J LIVE LAB</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold font-heading text-white">
              Neo4j Live Lab & Cypher Walkthrough
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Execute real Cypher queries against live Neo4j. Switch demo profiles or mutate ratings to watch the table and Cytoscape graph update in real-time.
            </p>
          </div>

          {/* Active Profile Sync Indicator & Quick Switcher */}
          <div className="flex items-center gap-3 bg-black/50 border border-white/10 rounded-2xl p-2.5 px-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
                {activeUserObj ? activeUserObj.username.charAt(0) : 'U'}
              </div>
              <div className="text-left">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Target Profile</span>
                <span className="text-xs font-semibold text-white truncate max-w-[120px] block">
                  {activeUserObj ? activeUserObj.username : activeUserId}
                </span>
              </div>
            </div>

            <select
              value={activeUserId}
              onChange={(e) => handleUserChange(e.target.value)}
              className="bg-white/5 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id} className="bg-[#121216] text-white">
                  {u.username} ({u.user_id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Live Mutation Demo Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-rose-950/20 to-black border border-amber-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wide">
                Live Database Mutation Simulator
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Real Neo4j Write
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Click any action to write directly to Neo4j for <strong>{activeUserObj?.username || activeUserId}</strong> and see this table update instantly!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => performLiveMutation('rate', 'm01', 'Inception', 5.0)}
            disabled={mutating}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-rose-600/30 border border-white/15 hover:border-rose-500/50 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Rate Inception 5★</span>
          </button>
          <button
            onClick={() => performLiveMutation('rate', 'm02', 'Interstellar', 4.5)}
            disabled={mutating}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-amber-600/30 border border-white/15 hover:border-amber-500/50 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Rate Interstellar 4.5★</span>
          </button>
          <button
            onClick={() => performLiveMutation('watchlist', 'm03', 'The Dark Knight')}
            disabled={mutating}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-cyan-600/30 border border-white/15 hover:border-cyan-500/50 text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Dark Knight to Watchlist</span>
          </button>
        </div>
      </div>

      {/* Mutation Notification Toast */}
      {mutationSuccess && (
        <div className="p-3 px-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{mutationSuccess}</span>
          </div>
          <button
            onClick={() => setMutationSuccess(null)}
            className="text-emerald-400 hover:text-white text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Query Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {curatedQueries.map((q) => (
          <button
            key={q.id}
            onClick={() => selectCurated(q, activeUserId)}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all border ${
              selectedQueryId === q.id
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                : 'bg-cine-card text-slate-400 border-cine-border hover:bg-cine-hover hover:text-white'
            }`}
          >
            {q.title}
          </button>
        ))}
      </div>

      {/* Cypher Editor and Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-cine-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" /> Cypher Query Editor
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExecute}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-black" />
                )}
                <span>{loading ? 'Running on Neo4j...' : 'Execute Cypher'}</span>
              </button>
            </div>
          </div>

          <textarea
            value={cypherText}
            onChange={(e) => {
              setCypherText(e.target.value);
            }}
            rows={7}
            className="w-full bg-black/60 font-mono text-xs text-amber-100 p-4 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500/60 leading-relaxed resize-none"
          />
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-cine-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              Query Parameters (JSON)
            </span>
            <span className="text-[10px] font-mono text-amber-400">
              $user_id: "{activeUserId}"
            </span>
          </div>
          <textarea
            value={paramsText}
            onChange={(e) => setParamsText(e.target.value)}
            rows={7}
            className="w-full bg-black/60 font-mono text-xs text-slate-200 p-4 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500/60 resize-none"
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Traversal Walkthrough Section */}
      {executionResult?.traversal_walkthrough && (
        <div className="glass-panel rounded-2xl p-6 border border-cine-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-rose-400" />
              <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
                Step-by-Step Path Traversal Walkthrough
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Hop {activeHopIndex + 1} of {executionResult.traversal_walkthrough.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {executionResult.traversal_walkthrough.map((hop: any, hIdx: number) => (
              <div
                key={hop.hop}
                onClick={() => setActiveHopIndex(hIdx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeHopIndex === hIdx
                    ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/30'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold text-rose-300">Hop #{hop.hop}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{hop.rel}</span>
                </div>
                <div className="text-xs text-slate-200 flex items-center gap-1.5 font-medium">
                  <span className="truncate">{hop.from}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{hop.to}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Measured Execution & Plan Telemetry */}
      {executionResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-cine-border">
            <span className="text-[11px] font-mono text-slate-400 block">Execution Time</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {executionResult.execution_time_ms} ms
            </span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-cine-border">
            <span className="text-[11px] font-mono text-slate-400 block">Rows Returned</span>
            <span className="text-xl font-bold font-mono text-rose-400">
              {executionResult.row_count}
            </span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-cine-border">
            <span className="text-[11px] font-mono text-slate-400 block">Database Hits</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {executionResult.plan_details?.db_hits ?? 'N/A'}
            </span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-cine-border">
            <span className="text-[11px] font-mono text-slate-400 block">Query Operator</span>
            <span className="text-sm font-bold font-mono text-cyan-400 truncate block" title={executionResult.plan_details?.operator}>
              {executionResult.plan_details?.operator ?? 'ProduceResults'}
            </span>
          </div>
        </div>
      )}

      {/* Results View: Tabular Records vs Interactive Cytoscape Graph */}
      {executionResult && (
        <div className="glass-panel rounded-2xl border border-cine-border overflow-hidden">
          <div className="p-4 border-b border-cine-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  activeTab === 'table' ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tabular Records ({executionResult.row_count})
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  activeTab === 'graph' ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Interactive Graph (Cytoscape.js)
              </button>
            </div>

            <button
              onClick={handleExecute}
              disabled={loading}
              className="text-xs font-mono text-slate-400 hover:text-amber-300 flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-white/5 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh Records</span>
            </button>
          </div>

          {activeTab === 'table' ? (
            <div className="overflow-x-auto max-h-[520px]">
              {executionResult.records && executionResult.records.length > 0 ? (
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="bg-black/80 sticky top-0 border-b border-cine-border text-slate-400 uppercase tracking-wider text-[11px]">
                    <tr>
                      {executionResult.columns?.map((col: string) => (
                        <th key={col} className="p-3 font-semibold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {executionResult.records.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                        {executionResult.columns?.map((col: string) => {
                          const val = row[col];
                          const isRating = col.toLowerCase().includes('rating');
                          const isInteraction = col.toLowerCase().includes('interaction');

                          return (
                            <td key={col} className="p-3 truncate max-w-xs">
                              {isInteraction ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  val === 'RATED'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : val === 'ADDED_TO_WATCHLIST'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                }`}>
                                  {val}
                                </span>
                              ) : isRating && val !== 'N/A' && !isNaN(Number(val)) ? (
                                <span className="text-amber-400 font-bold">
                                  ★ {Number(val).toFixed(1)}
                                </span>
                              ) : typeof val === 'object' ? (
                                JSON.stringify(val)
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <Database className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm text-slate-300 font-medium">
                    No database records found for user <span className="text-amber-300 font-mono">{activeUserId}</span> in this query.
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    This user may not have any matching ratings or graph traversals yet. Click any button in the <strong>Live Database Mutation Simulator</strong> above to create live records!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[480px] w-full bg-[#050608] relative">
              <div ref={cyRef} className="w-full h-full" />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-slate-400 flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> User
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Movie
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Director
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Actor
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
