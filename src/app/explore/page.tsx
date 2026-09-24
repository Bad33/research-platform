'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';
import { Loader2, ArrowRight } from 'lucide-react';

// Dynamically import the graph to avoid Next.js Server-Side Rendering issues with WebGL
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function ExplorerPage() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  const fgRef = useRef<any>();

  useEffect(() => {
    async function fetchGraph() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Fetch the graph topology we just created in SQL
      const { data, error } = await supabase.rpc('get_graph_data', { 
        similarity_threshold: 0.65 
      });

      if (!error && data) {
        setGraphData(data);
      }
      setLoading(false);
    }
    fetchGraph();
  }, []);

  // Center the camera on a node when clicked
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(4, 2000);
    }
  }, []);

  // Assign distinct colors based on the domains you read
  const getNodeColor = (category: string) => {
    if (category?.includes('AI') || category?.includes('Artificial')) return '#3b82f6'; // Blue
    if (category?.includes('Oncology') || category?.includes('Genomics')) return '#e11d48'; // Rose
    if (category?.includes('Analytics') || category?.includes('Sports')) return '#d97706'; // Amber
    return '#71717a'; // Default Zinc
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 overflow-hidden font-sans">
      
      {/* Top Nav Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between pointer-events-none">
        <h1 className="text-white text-2xl font-serif font-bold tracking-tight">
          Synthetica <span className="text-zinc-500 font-light">Galaxy</span>
        </h1>
        <a href="/" className="pointer-events-auto text-sm text-zinc-400 hover:text-white transition">
          Return to Feed
        </a>
      </div>

      {/* The WebGL Force Graph */}
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeColor={(node: any) => getNodeColor(node.category)}
        nodeRelSize={6}
        linkColor={() => 'rgba(255,255,255,0.1)'}
        linkWidth={1}
        onNodeClick={handleNodeClick}
        // Add a glowing effect to the nodes
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.title;
          const fontSize = 12/globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          
          // Draw Node
          ctx.beginPath();
          ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
          ctx.fillStyle = getNodeColor(node.category);
          ctx.fill();
          
          // Draw Title Label if zoomed in enough
          if (globalScale > 2) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(label.substring(0, 30) + '...', node.x, node.y + 8);
          }
        }}
      />

      {/* Side Panel for Selected Paper */}
      {selectedNode && (
        <div className="absolute bottom-6 right-6 w-96 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-xl p-6 shadow-2xl z-20 animate-in slide-in-from-right-8">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getNodeColor(selectedNode.category) }} />
            {selectedNode.category || 'Research'}
          </div>
          <h2 className="text-lg font-serif font-bold text-white leading-tight mb-4">
            {selectedNode.title}
          </h2>
          
          <a 
            href={`/paper/${selectedNode.id}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-white text-zinc-950 font-medium text-sm hover:bg-zinc-200 transition"
          >
            Read Full Analysis <ArrowRight className="w-4 h-4" />
          </a>
          
          <button 
            onClick={() => setSelectedNode(null)}
            className="mt-3 w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
