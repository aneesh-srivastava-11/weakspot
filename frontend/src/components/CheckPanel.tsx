"use client";

import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, CheckCircle, Activity, ArrowRight } from 'lucide-react';
import { PatternType, PracticeLog } from '../types';
import { PATTERNS } from '../data';
import { api } from '../lib/api';

interface CheckPanelProps {
  logs: PracticeLog[];
  masteredPatterns: Record<PatternType, boolean>;
  onMarkMastered: (pattern: PatternType) => Promise<void>;
  selectedPattern: PatternType;
  setSelectedPattern: (pattern: PatternType) => void;
  onTelemetryLog?: (method: 'remember' | 'recall' | 'improve' | 'forget' | 'system', message: string) => void;
}

export default function CheckPanel({
  logs,
  masteredPatterns,
  onMarkMastered,
  selectedPattern,
  setSelectedPattern,
  onTelemetryLog
}: CheckPanelProps) {
  const [hasChecked, setHasChecked] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [warningFound, setWarningFound] = useState(false);
  const [aiBriefing, setAiBriefing] = useState('');

  // Filter logs for selected pattern that count as weak spots
  const patternMistakes = logs.filter(
    (log) => log.pattern === selectedPattern && log.result !== 'Solved'
  );
  
  const isMastered = masteredPatterns[selectedPattern];

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setHasChecked(false);

    try {
      if (onTelemetryLog) {
        onTelemetryLog('recall', `recall(): Querying database for concept pattern "${selectedPattern}"...`);
      }

      const res = await api.checkBeforeSolving(selectedPattern);
      
      setWarningFound(res.warning_found);
      setAiBriefing(res.briefing);

      if (onTelemetryLog) {
        if (res.warning_found) {
          onTelemetryLog('recall', `recall(): Pattern "${selectedPattern}" matches memory: returned logical pitfall briefing.`);
        } else {
          onTelemetryLog('recall', `recall(): Pattern "${selectedPattern}" clear: status green (zero failures or marked mastered).`);
        }
      }
    } catch (err: any) {
      console.error(err);
      setWarningFound(false);
      setAiBriefing('Failed to contact Cognee sidecar. Make sure Sidecar container is running.');
      if (onTelemetryLog) {
        onTelemetryLog('system', `system(): Recall failed: ${err.message}`);
      }
    } finally {
      setIsSearching(false);
      setHasChecked(true);
    }
  };

  const handleForgetMastery = async () => {
    if (onTelemetryLog) {
      onTelemetryLog('forget', `forget(): Triggering memory pruning sequence for "${selectedPattern}"...`);
    }
    
    try {
      await onMarkMastered(selectedPattern);
      setWarningFound(false);
      setAiBriefing("You've proven mastery over this pattern. Memory warning nodes are cleared.");
      
      if (onTelemetryLog) {
        onTelemetryLog('forget', `forget(): Pruned active weak spot memory nodes for "${selectedPattern}". Memory slot cleared.`);
      }
    } catch (err: any) {
      if (onTelemetryLog) {
        onTelemetryLog('system', `system(): Forget failed: ${err.message}`);
      }
    }
  };

  // Reset check state if pattern changes
  useEffect(() => {
    setHasChecked(false);
  }, [selectedPattern]);

  return (
    <div className="rounded-xl border border-[#1b1e2c] bg-[#0c0d12] p-6 h-full flex flex-col justify-between" id="check-panel-container">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="h-5.5 w-5.5 rounded border border-[#272a37] bg-[#11131c] flex items-center justify-center font-mono text-[10px] text-blue-400 font-bold">
              ?
            </div>
            <h3 className="font-sans text-sm font-semibold text-white tracking-tight">
              Pre-Solve Pattern Checker
            </h3>
          </div>
          <span className="font-mono text-[9px] text-[#5b647f] tracking-widest uppercase">
            recall()
          </span>
        </div>

        <p className="font-sans text-xs text-[#8b949e] leading-relaxed mb-5">
          Starting a new problem? Interrogate your cognitive history to identify custom traps before writing buggy code.
        </p>

        {/* Checker Select & Button */}
        <form onSubmit={handleCheck} className="space-y-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={selectedPattern}
                onChange={(e) => setSelectedPattern(e.target.value as PatternType)}
                className="w-full appearance-none rounded border border-[#222533] bg-[#11131c] px-3 py-2 font-mono text-xs text-white focus:border-blue-500 focus:outline-none transition-colors"
                id="check-pattern-select"
              >
                {PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#5b647f]">
                ▼
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold py-2 px-4 rounded transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(37,99,235,0.15)] shrink-0 cursor-pointer"
              id="check-submit-btn"
            >
              {isSearching ? (
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              <span>Check History</span>
            </button>
          </div>
        </form>

        {/* Results Container */}
        <div className="min-h-[180px] flex flex-col justify-center">
          {!hasChecked && !isSearching && (
            <div className="text-center py-6 border border-dashed border-[#1e2230] rounded-lg bg-[#0d0e14]">
              <Activity className="h-5 w-5 text-[#3f445b] mx-auto mb-2" />
              <p className="font-sans text-xs text-[#5b647f]">
                Select a pattern and trigger check.
              </p>
            </div>
          )}

          {isSearching && (
            <div className="text-center py-8">
              <span className="font-mono text-xs text-blue-400 block animate-pulse">
                Interrogating Cognee graph database...
              </span>
              <span className="font-mono text-[9px] text-[#5b647f] block mt-1">
                Searching pattern match in logs ({logs.length} entries)
              </span>
            </div>
          )}

          {hasChecked && !isSearching && (
            <>
              {warningFound && !isMastered ? (
                /* Warning Card: Weak spots found */
                <div 
                  className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3.5 glow-amber"
                  id="warning-card-active"
                >
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-sans text-xs font-bold text-white">
                        Weak spot flagged in <span className="font-mono text-amber-500">{selectedPattern}</span>
                      </h4>
                      <p className="mt-1 font-sans text-[11px] text-[#8b949e]">
                        You've struggled with this pattern <strong className="text-white font-mono text-xs">{patternMistakes.length} time{patternMistakes.length > 1 ? 's' : ''}</strong> before. Read your Cognee-synthesized warnings:
                      </p>
                    </div>
                  </div>

                  {/* Gemini formatted warning briefing */}
                  <div className="text-[11px] font-sans leading-relaxed text-[#c9d1d9] bg-[#0c0d12] px-3 py-2 rounded border border-[#1e2230] font-mono whitespace-pre-line leading-relaxed">
                    {aiBriefing}
                  </div>

                  {/* List of past mistakes */}
                  <div className="space-y-2 border-t border-[#1b1e2c] pt-3 max-h-[120px] overflow-y-auto pr-1">
                    <span className="font-mono text-[9px] text-[#5b647f] block uppercase tracking-wider">Raw logged slips:</span>
                    {patternMistakes.slice(0, 3).map((m) => (
                      <div key={m.id} className="text-[10px] font-sans leading-relaxed">
                        <div className="flex items-center justify-between text-[#8b949e]">
                          <span className="font-semibold text-white truncate max-w-[150px]">
                            {m.problemTitle}
                          </span>
                          <span className="font-mono text-[9px] text-[#5b647f]">
                            {new Date(m.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[#8b949e] italic mt-0.5 truncate pr-2">
                          &gt; {m.mistakeNote}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Mastered CTA inside check panel */}
                  <div className="border-t border-[#1b1e2c] pt-3.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] text-[#5b647f]">
                      Flag active inside memory
                    </span>
                    <button
                      type="button"
                      onClick={handleForgetMastery}
                      className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-emerald-500/20 text-amber-500 hover:text-emerald-400 border border-amber-500/25 hover:border-emerald-500/30 font-sans text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      id="btn-prove-mastery"
                    >
                      <span>Prove Mastered (Clear Flags)</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Success Card: No known weak spots here */
                <div 
                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 text-center space-y-3"
                  id="success-card-clean"
                >
                  <div className="mx-auto h-7 w-7 rounded-full border border-emerald-500/25 bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-bold text-white">
                      No active weak spots in <span className="font-mono text-emerald-400">{selectedPattern}</span>
                    </h4>
                    <p className="mt-1.5 font-sans text-[11px] text-[#8b949e] max-w-xs mx-auto leading-relaxed">
                      {isMastered 
                        ? "You've proven mastery over this pattern. Historical warning cache is cleared and nodes are marked safe." 
                        : "No failed logs or hint-assisted logs stored for this concept. Your memory is clean."}
                    </p>
                  </div>
                  <div className="font-mono text-[9px] text-[#5b647f] pt-1">
                    STATUS: SECURE_NODE_GREEN
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
