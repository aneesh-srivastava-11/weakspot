"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal, Shield, Cpu } from 'lucide-react';
import { TerminalLog } from '../types';

interface ActivityLogTerminalProps {
  logs: TerminalLog[];
  onClearLogs?: () => void;
}

export default function ActivityLogTerminal({
  logs,
  onClearLogs
}: ActivityLogTerminalProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep the latest telemetry updates visible
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="rounded-xl border border-[#1b1e2c] bg-[#07080c] p-5 h-full flex flex-col justify-between" id="activity-log-terminal">
      {/* Terminal Title Header */}
      <div>
        <div className="flex items-center justify-between border-b border-[#141622] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#5b647f]" />
            <span className="font-mono text-xs font-bold text-[#c9d1d9] uppercase tracking-wider">
              WeakSpot Engine Telemetry
            </span>
            <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono text-blue-400">
              <span className="h-1 w-1 rounded-full bg-blue-400 animate-ping"></span>
              <span>LIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-[#5b647f]">
            <span>STDOUT</span>
            {onClearLogs && (
              <button 
                onClick={onClearLogs}
                className="text-[#3f445b] hover:text-[#8b949e] transition cursor-pointer"
                title="Clear feed logs"
                id="btn-clear-telemetry"
              >
                [CLEAR]
              </button>
            )}
          </div>
        </div>

        {/* Streaming Logs list */}
        <div 
          className="space-y-2 max-h-[160px] overflow-y-auto pr-1 select-text scrollbar-thin"
          id="terminal-stdout-container"
        >
          {logs.map((log) => {
            // Pick a color based on method
            let methodColor = 'text-blue-400';
            let msgColor = 'text-[#c9d1d9]';
            if (log.method === 'remember') {
              methodColor = 'text-amber-500';
              msgColor = 'text-amber-500/95';
            } else if (log.method === 'improve') {
              methodColor = 'text-amber-600';
              msgColor = 'text-amber-400';
            } else if (log.method === 'forget') {
              methodColor = 'text-emerald-400';
              msgColor = 'text-emerald-400/90';
            } else if (log.method === 'system') {
              methodColor = 'text-blue-400';
              msgColor = 'text-[#8b949e]';
            }

            const formattedTime = new Date(log.timestamp).toLocaleTimeString(undefined, {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            return (
              <div 
                key={log.id} 
                className="font-mono text-[10px] leading-relaxed flex items-start gap-2 border-b border-[#0f1016]/30 pb-1"
              >
                <span className="text-[#3f445b] shrink-0 select-none">
                  [{formattedTime}]
                </span>
                
                <span className={`${methodColor} font-semibold shrink-0 select-none`}>
                  {log.method}()
                </span>

                <span className={`${msgColor} break-all`}>
                  {log.message}
                </span>
              </div>
            );
          })}
          
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Footer Diagnostic Bar */}
      <div className="flex items-center justify-between border-t border-[#141622] pt-3 mt-4 text-[9px] font-mono text-[#5b647f]">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-emerald-500" />
            <span>SANDBOX: VERIFIED</span>
          </span>
          <span>|</span>
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3 text-blue-400" />
            <span>CPU_LOAD: 0.12%</span>
          </span>
        </div>
        <span>VIRTUAL_INDEX: ACTIVE</span>
      </div>
    </div>
  );
}
