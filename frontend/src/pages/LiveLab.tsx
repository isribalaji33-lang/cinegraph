import React, { useEffect, useState, useRef } from 'react';
import cytoscape from 'cytoscape';
import { Network, Play, Terminal, Cpu, Database, Eye, ChevronRight, GitFork, AlertCircle, RefreshCw } from 'lucide-react';
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

export const LiveLab: React.FC = () => {
  const [curatedQueries, setCuratedQueries] = useState<CuratedQuery[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string>('');
  const [cypherText, setCypherText] = useState<string>('');
  const [paramsText, setParamsText] = useState<string>('{}');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'graph' | 'table'>('graph');
  const [activeHopIndex, setActiveHopIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    fetchJson<CuratedQuery[]>('/lab/curated').then((data) => {
      setCuratedQueries(data);
      if (data.length > 0) {
        selectCurated(data[0]);
      }
    }).catch(console.error);
  }, []);

  const selectCurated = (q: CuratedQuery) => {
    setSelectedQueryId(q.id);
    setCypherText(q.cypher);
    setParamsText(JSON.stringify(q.default_params, null, 2));
    setErrorMessage(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(paramsText);
      } catch (e) {
        throw new Error('Invalid JSON format in parameters editor.');
      }

      const res = await fetchJson<any>('/lab/execute', {
        method: 'POST',
        body: JSON.stringify({
          query_id: selectedQueryId || undefined,
          cypher: cypherText,
          params: parsedParams,
        }),
      });
      setExecutionResult(res);
      setActiveHopIndex(0);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 mb-2">
          <Terminal className="w-3.5 h-3.5" />
          <span>PILLAR 1: NEO4J LIVE LAB</span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-white">
          Neo4j Live Lab & Cypher Walkthrough
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Execute real Cypher queries against the live Neo4j database. Inspect the physical query execution plan (EXPLAIN / PROFILE), db hits, and watch animated multi-hop graph traversals.
        </p>
      </div>

      {/* Query Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {curatedQueries.map((q) => (
          <button
            key={q.id}
            onClick={() => selectCurated(q)}
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
            <button
              onClick={handleExecute}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>{loading ? 'Running on Neo4j...' : 'Execute Cypher'}</span>
            </button>
          </div>

          <textarea
            value={cypherText}
            onChange={(e) => setCypherText(e.target.value)}
            rows={7}
            className="w-full bg-black/60 font-mono text-xs text-amber-100 p-4 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500/60 leading-relaxed resize-none"
          />
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-cine-border space-y-3">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            Query Parameters (JSON)
          </span>
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

      {/* Results View: Interactive Cytoscape Graph vs Table */}
      {executionResult && (
        <div className="glass-panel rounded-2xl border border-cine-border overflow-hidden">
          <div className="p-4 border-b border-cine-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  activeTab === 'graph' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Interactive Graph (Cytoscape.js)
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  activeTab === 'table' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tabular Records ({executionResult.row_count})
              </button>
            </div>
          </div>

          {activeTab === 'graph' ? (
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
          ) : (
            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="bg-black/60 sticky top-0 border-b border-cine-border text-slate-400">
                  <tr>
                    {executionResult.columns?.map((col: string) => (
                      <th key={col} className="p-3 uppercase">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {executionResult.records?.map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                      {executionResult.columns?.map((col: string) => (
                        <td key={col} className="p-3 truncate max-w-xs">
                          {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
