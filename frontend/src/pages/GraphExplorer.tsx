import React, { useEffect, useState, useRef } from 'react';
import cytoscape from 'cytoscape';
import { Network, Search, Filter, Expand, Info, RefreshCw } from 'lucide-react';
import { fetchJson } from '../api/client';

export const GraphExplorer: React.FC = () => {
  const [selectedLabels, setSelectedLabels] = useState<string[]>(['Movie', 'Director', 'Actor', 'Genre']);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);

  const ALL_LABELS = ['Movie', 'Director', 'Actor', 'Genre', 'Studio', 'Award'];

  const loadGraph = async (centerId?: string) => {
    setLoading(true);
    try {
      const typesParam = selectedLabels.join(',');
      const url = centerId
        ? `/graph/explore?center_movie_id=${centerId}&node_types=${typesParam}&limit=60`
        : `/graph/explore?node_types=${typesParam}&limit=60`;
      const data = await fetchJson<any>(url);

      if (cyRef.current) {
        if (cyInstance.current) {
          cyInstance.current.destroy();
        }

        const elements = [...data.nodes, ...data.edges];
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
                'text-margin-y': 4,
                'width': 36,
                'height': 36,
                'border-width': 2,
                'border-color': '#ffffff33',
              },
            },
            {
              selector: 'edge',
              style: {
                'width': 2,
                'line-color': '#e11d4866',
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
            padding: 40,
          },
        });

        cyInstance.current.on('tap', 'node', (evt) => {
          const node = evt.target;
          setSelectedNode(node.data());
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [selectedLabels]);

  const handleExpandNode = async () => {
    if (!selectedNode || !cyInstance.current) return;
    try {
      const neighborData = await fetchJson<any>(`/graph/node/${selectedNode.id}/neighbors`);
      cyInstance.current.add([...neighborData.nodes, ...neighborData.edges]);
      cyInstance.current.layout({ name: 'cose', animate: true }).run();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      setSelectedLabels(selectedLabels.filter((l) => l !== label));
    } else {
      setSelectedLabels([...selectedLabels, label]);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-2">
            <Network className="w-3.5 h-3.5" />
            <span>INTERACTIVE KNOWLEDGE GRAPH</span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading text-white">
            Explore the Movie Graph
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Traverse nodes and relationships directly from Neo4j. Click any node to inspect properties and expand adjacent edges.
          </p>
        </div>

        <button
          onClick={() => loadGraph()}
          className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cine-card border border-cine-border hover:bg-cine-hover text-slate-200 flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset View
        </button>
      </div>

      {/* Label filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-slate-400 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter Labels:
        </span>
        {ALL_LABELS.map((label) => {
          const isSelected = selectedLabels.includes(label);
          return (
            <button
              key={label}
              onClick={() => toggleLabel(label)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                isSelected
                  ? 'bg-rose-600/30 border-rose-500/60 text-white'
                  : 'bg-cine-card border-cine-border text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Canvas and Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass-panel rounded-2xl border border-cine-border h-[560px] overflow-hidden relative">
          <div ref={cyRef} className="w-full h-full bg-[#050608]" />

          {loading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-xs font-mono text-rose-400">
              Fetching Graph Neighbors from Neo4j...
            </div>
          )}

          {/* Color Legend */}
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> Movie</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Director</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Actor</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" /> Genre</span>
          </div>
        </div>

        {/* Node Properties Inspector */}
        <div className="glass-panel rounded-2xl p-6 border border-cine-border flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <Info className="w-4 h-4 text-rose-400" /> Node Inspector
            </h3>

            {selectedNode ? (
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Label Type</span>
                  <span className="block font-mono text-xs font-bold text-rose-400">{selectedNode.type}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Node ID</span>
                  <span className="block font-mono text-xs text-slate-300">{selectedNode.id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Name / Title</span>
                  <span className="block font-heading font-bold text-base text-white">{selectedNode.label}</span>
                </div>

                {selectedNode.properties && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Properties</span>
                    <pre className="text-[11px] font-mono text-slate-300 bg-black/40 p-3 rounded-lg overflow-x-auto max-h-48 border border-white/5">
                      {JSON.stringify(selectedNode.properties, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Click on any node in the graph canvas to inspect its Neo4j properties and relationships.
              </p>
            )}
          </div>

          {selectedNode && (
            <button
              onClick={handleExpandNode}
              className="w-full py-2.5 rounded-xl text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
            >
              <Expand className="w-3.5 h-3.5" />
              <span>Expand Neighbors</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
