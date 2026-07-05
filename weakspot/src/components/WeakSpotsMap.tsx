import React, { useRef, useEffect, useState } from 'react';
import { Network, Sparkles, HelpCircle, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { PatternType, PracticeLog } from '../types';
import { NODE_POSITIONS, NODE_CONNECTIONS } from '../data';

interface WeakSpotsMapProps {
  logs: PracticeLog[];
  masteredPatterns: Record<PatternType, boolean>;
  selectedPattern: PatternType;
  onSelectPattern: (pattern: PatternType) => void;
  onResetAllLogs?: () => void;
}

export default function WeakSpotsMap({
  logs,
  masteredPatterns,
  selectedPattern,
  onSelectPattern,
  onResetAllLogs
}: WeakSpotsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [hoveredPattern, setHoveredPattern] = useState<PatternType | null>(null);

  // ResizeObserver to dynamically update SVG size for perfect responsive fluid layouts
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 400),
          height: Math.max(height, 350)
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute node parameters based on actual practices state
  const nodes = NODE_POSITIONS.map((pos) => {
    const patternLogs = logs.filter((log) => log.pattern === pos.pattern);
    const failureLogs = patternLogs.filter((log) => log.result !== 'Solved');
    
    const failureCount = failureLogs.length;
    const isMastered = !!masteredPatterns[pos.pattern];
    const isActiveWeakSpot = failureCount > 0 && !isMastered;

    // Radius calculation: base size + factor of failures
    const baseRadius = 14;
    const radiusFactor = Math.min(failureCount * 5, 24);
    const radius = baseRadius + (isActiveWeakSpot ? radiusFactor : 0);

    return {
      ...pos,
      failureCount,
      isMastered,
      isActiveWeakSpot,
      radius,
      totalCount: patternLogs.length
    };
  });

  // Find coordinates helper
  const getNodeCoords = (patternName: PatternType) => {
    const node = nodes.find((n) => n.pattern === patternName);
    if (!node) return { x: 0, y: 0 };
    return {
      x: (node.x / 100) * dimensions.width,
      y: (node.y / 100) * dimensions.height
    };
  };

  return (
    <div className="rounded-xl border border-[#1b1e2c] bg-[#0c0d12] p-6 h-full flex flex-col justify-between" id="weak-spots-map-container">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-5.5 w-5.5 rounded border border-[#272a37] bg-[#11131c] flex items-center justify-center">
              <Network className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <h3 className="font-sans text-sm font-semibold text-white tracking-tight">
              Memory Constellation Mapping
            </h3>
          </div>
          <p className="font-sans text-[11px] text-[#8b949e]">
            Active weak spots shine as <span className="text-amber-500 font-medium">solid amber</span>. Size scales with failures. Click a node to query.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-[#5b647f]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
            <span>Active Spot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-dashed border-[#3f445b]"></span>
            <span>Mastered/Clean</span>
          </div>
          {onResetAllLogs && (
            <button
              onClick={onResetAllLogs}
              className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#272a37] hover:border-red-500/20 bg-transparent text-[#8b949e] hover:text-red-400 hover:bg-red-500/5 transition cursor-pointer"
              title="Reset state data"
              id="btn-reset-constellation"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              <span>Reset Data</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG Map Container */}
      <div 
        ref={containerRef}
        className="relative w-full flex-1 min-h-[350px] bg-[#07080c] rounded-lg border border-[#171a25] overflow-hidden"
        id="constellation-canvas-wrapper"
      >
        <svg 
          width={dimensions.width} 
          height={dimensions.height}
          className="absolute inset-0"
        >
          {/* Node Connections/Lines */}
          {NODE_CONNECTIONS.map(([p1, p2], i) => {
            const c1 = getNodeCoords(p1);
            const c2 = getNodeCoords(p2);
            
            const n1 = nodes.find(n => n.pattern === p1);
            const n2 = nodes.find(n => n.pattern === p2);
            
            const bothActive = n1?.isActiveWeakSpot && n2?.isActiveWeakSpot;
            
            return (
              <line
                key={`connection-${i}`}
                x1={c1.x}
                y1={c1.y}
                x2={c2.x}
                y2={c2.y}
                stroke={bothActive ? '#d97706' : '#1a1d29'}
                strokeWidth={bothActive ? 1.5 : 1}
                strokeOpacity={bothActive ? 0.6 : 0.4}
                className={bothActive ? 'animate-line-flow' : undefined}
              />
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const coords = getNodeCoords(node.pattern);
            const isSelected = selectedPattern === node.pattern;
            const isHovered = hoveredPattern === node.pattern;

            return (
              <g
                key={node.pattern}
                transform={`translate(${coords.x}, ${coords.y})`}
                onClick={() => onSelectPattern(node.pattern)}
                onMouseEnter={() => setHoveredPattern(node.pattern)}
                onMouseLeave={() => setHoveredPattern(null)}
                className="cursor-pointer group"
                id={`node-${node.pattern.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              >
                {/* Node Glow (Amber pulse) */}
                {node.isActiveWeakSpot && (
                  <circle
                    r={node.radius + 6}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeOpacity={isSelected ? 0.6 : 0.25}
                    className="animate-pulse-glow"
                  />
                )}

                {/* Selection Highlight Ring */}
                {isSelected && (
                  <circle
                    r={node.radius + 10}
                    fill="none"
                    stroke={node.isActiveWeakSpot ? '#f59e0b' : '#3b82f6'}
                    strokeWidth="1"
                    strokeOpacity="0.8"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Base Node Circle */}
                <circle
                  r={node.radius}
                  fill={
                    node.isActiveWeakSpot
                      ? 'rgba(245, 158, 11, 0.15)'
                      : isSelected
                      ? 'rgba(59, 130, 246, 0.05)'
                      : '#090a0f'
                  }
                  stroke={
                    node.isActiveWeakSpot
                      ? '#f59e0b'
                      : node.isMastered
                      ? '#10b981'
                      : isSelected
                      ? '#3b82f6'
                      : '#272a37'
                  }
                  strokeWidth={node.isActiveWeakSpot || isSelected || node.isMastered ? 2 : 1.5}
                  strokeDasharray={node.isMastered ? '0' : node.failureCount === 0 ? '4 3' : '0'}
                  className="transition-all duration-300"
                />

                {/* Internal Node Decoration (Alert triangle or Checkmark or Count) */}
                {node.isActiveWeakSpot ? (
                  <g transform="translate(0, 0)">
                    <text
                      textAnchor="middle"
                      dy=".3em"
                      fill="#f59e0b"
                      fontSize={node.radius > 20 ? "11px" : "9px"}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.failureCount}
                    </text>
                  </g>
                ) : node.isMastered ? (
                  <g transform="scale(0.7) translate(-6, -6)">
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </g>
                ) : null}

                {/* Text Label on the node */}
                <text
                  y={node.radius + 14}
                  textAnchor="middle"
                  fill={node.isActiveWeakSpot ? '#fff' : isSelected ? '#3b82f6' : '#8b949e'}
                  fontSize="10px"
                  fontFamily="sans-serif"
                  fontWeight={node.isActiveWeakSpot || isSelected ? '600' : 'normal'}
                  className="transition-colors pointer-events-none select-none"
                >
                  {node.pattern}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip displaying stats */}
        <div className="absolute bottom-3 left-3 bg-[#0d0e14]/95 border border-[#1d202e] px-3 py-2 rounded font-mono text-[10px] text-[#8b949e] space-y-1 select-none pointer-events-none max-w-[200px]">
          <div className="text-white font-sans font-medium text-[11px] mb-1">
            {hoveredPattern || selectedPattern}
          </div>
          {(() => {
            const currentPattern = hoveredPattern || selectedPattern;
            const patLogs = logs.filter((l) => l.pattern === currentPattern);
            const failLogs = patLogs.filter((l) => l.result !== 'Solved');
            const solvedLogs = patLogs.filter((l) => l.result === 'Solved');
            const isPatMastered = !!masteredPatterns[currentPattern];

            return (
              <>
                <p>Status: <span className={isPatMastered ? 'text-emerald-400' : failLogs.length > 0 ? 'text-amber-500 font-bold' : 'text-[#8b949e]'}>
                  {isPatMastered ? 'MASTERED' : failLogs.length > 0 ? 'ACTIVE_WEAK_SPOT' : 'CLEAN'}
                </span></p>
                <p>Failures logged: <span className="text-white">{failLogs.length}</span></p>
                <p>Passes logged: <span className="text-white">{solvedLogs.length}</span></p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
