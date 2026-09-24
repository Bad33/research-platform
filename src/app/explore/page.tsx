'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';
import { Loader2, ArrowRight, Network, Sparkles } from 'lucide-react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function AdvancedExplorerPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  
  // Interactive State
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<any>(null);
  
  const fgRef = useRef<any>(null);

  useEffect(() => {
    async function fetchGraph() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Lowered threshold to 0.60 to show more connections among smaller datasets
      const { data, error } = await supabase.rpc('get_graph_data', { 
        similarity_threshold: 0.60 
      });

      if (!error && data) {
        // Pre-compute neighbors for the highlight effect
        const nodes = data.nodes;
        const links = data.links;
        
        nodes.forEach((node: any) => {
          node.neighbors = [];
          node.links = [];
        });

        links.forEach((link: any) => {
          const a = nodes.find((n: any) => n.id === link.source);
          const b = nodes.find((n: any) => n.id === link.target);
          if (a && b) {
            a.neighbors.push(b);
            b.neighbors.push(a);
            a.links.push(link);
            b.links.push(link);
          }
        });

        setGraphData({ nodes, links });
      }
      setLoading(false);
    }
    fetchGraph();
  }, []);

  const getNodeColor = (category: string) => {
    if (category?.includes('AI') || category?.includes('Artificial')) return '#3b82f6'; 
    if (category?.includes('Oncology') || category?.includes('Genomics')) return '#e11d48'; 
    if (category?.includes('Analytics') || category?.includes('Sports')) return '#d97706'; 
    return '#71717a'; 
  };

  // Handle Raycasting Hover Effect
  const handleNodeHover = useCallback((node: any) => {
    highlightNodes.clear();
    highlightLinks.clear();

    if (node) {
      highlightNodes.add(node);
      node.neighbors.forEach((neighbor: any) => highlightNodes.add(neighbor));
      node.links.forEach((link: any) => highlightLinks.add(link));
    }

    setHoverNode(node || null);
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  }, [highlightNodes, highlightLinks]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(6, 2000);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#09090b] overflow-hidden font-sans">
      
      {/* Top Nav Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between pointer-events-none">
        <div>
          <h1 className="text-white text-2xl font-serif font-bold tracking-tight flex items-center gap-2">
            Synthetica <span className="text-zinc-500 font-light">Galaxy</span>
          </h1>
          <p className="text-zinc-500 text-xs mt-1 font-medium">
            {graphData.nodes.length} Papers Mapped via Semantic Vector Embeddings
          </p>
        </div>
        <a href="/" className="pointer-events-auto text-sm font-medium text-zinc-400 hover:text-white transition">
          Return to Feed
        </a>
      </div>

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeRelSize={6}
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        // Dim links if a node is hovered but the link isn't connected to it
        linkColor={(link: any) => 
          highlightLinks.has(link) ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.05)'
        }
        linkWidth={(link: any) => (highlightLinks.has(link) ? 2 : 1)}
        linkDirectionalParticles={4}
        linkDirectionalParticleWidth={(link: any) => (highlightLinks.has(link) ? 3 : 0)}
        
        // Custom Canvas Drawing for Highlight Effects
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const isHighlighted = highlightNodes.has(node);
          const isHovered = node === hoverNode;
          
          // Base radius
          const r = isHovered ? 8 : (isHighlighted ? 6 : 4);
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          
          // Opacity logic: If we are hovering over something, dim non-highlighted nodes
          const baseColor = getNodeColor(node.category);
          ctx.fillStyle = hoverNode && !isHighlighted 
            ? `${baseColor}20` // Extremely dim hex opacity
            : baseColor;
          ctx.fill();
          
          // Draw Labels only for highlighted nodes or if zoomed in very close
          if (isHighlighted || globalScale > 3) {
            const fontSize = isHovered ? 14 / globalScale : 10 / globalScale;
            ctx.font = `${isHovered ? 'bold ' : ''}${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = hoverNode && !isHighlighted ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';
            ctx.fillText(node.title.substring(0, 40) + '...', node.x, node.y + (r + 6));
          }
        }}
      />

      {/* Advanced Rich Side Panel */}
      {selectedNode && (
        <div className="absolute bottom-6 right-6 w-[420px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl z-20 flex flex-col max-h-[80vh]">
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getNodeColor(selectedNode.category) }} />
              {selectedNode.category || 'Research'}
            </div>
            {selectedNode.score && (
               <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                 <Sparkles className="w-3 h-3" /> Impact: {selectedNode.score}
               </div>
            )}
          </div>

          <h2 className="text-xl font-serif font-bold text-white leading-tight mb-4">
            {selectedNode.title}
          </h2>
          
          {/* Scrollable abstract/TLDR area inside the map */}
          <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-3 custom-scrollbar">
             {selectedNode.tldr && selectedNode.tldr.length > 0 ? (
                <ul className="space-y-3">
                  {selectedNode.tldr.map((bullet: string, i: number) => (
                    <li key={i} className="text-sm text-zinc-300 leading-relaxed flex items-start gap-2">
                       <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                       <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
             ) : (
               <p className="text-sm text-zinc-400">No summary extracted for this paper.</p>
             )}
             
             <div className="pt-4 mt-4 border-t border-zinc-800 text-xs text-zinc-500 flex items-center gap-2">
               <Network className="w-4 h-4" />
               Connected to {selectedNode.neighbors?.length || 0} similar papers in this cluster
             </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setSelectedNode(null)}
              className="px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition"
            >
              Close
            </button>
            <a 
              href={`/paper/${selectedNode.id}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-500 transition shadow-lg shadow-blue-900/20"
            >
              Open Interactive Reading <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
