"use client";

import React, { useState } from 'react';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import { Difficulty, PatternType, PracticeResult, UserState } from '../types';
import { PATTERNS } from '../data';
import { useRouter } from 'next/navigation';

interface LogPanelProps {
  onAddLog: (log: {
    problemTitle: string;
    pattern: PatternType;
    difficulty: Difficulty;
    result: PracticeResult;
    mistakeNote: string;
  }) => Promise<void>;
  userState: UserState;
}

export default function LogPanel({
  onAddLog,
  userState
}: LogPanelProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [pattern, setPattern] = useState<PatternType>('Sliding Window');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [result, setResult] = useState<PracticeResult>('Failed');
  const [mistake, setMistake] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isLimitReached = userState.tier === 'Free' && userState.logsCountToday >= 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !mistake.trim() || loading) return;

    if (isLimitReached) {
      router.push('/pricing');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await onAddLog({
        problemTitle: title.trim(),
        pattern,
        difficulty,
        result,
        mistakeNote: mistake.trim()
      });

      setTitle('');
      setMistake('');
      setSuccessMsg('Telemetry successfully compiled to memory.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to submit log attempt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#1b1e2c] bg-[#0c0d12] p-6 h-full flex flex-col justify-between" id="log-panel-container">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="h-5.5 w-5.5 rounded border border-[#272a37] bg-[#11131c] flex items-center justify-center font-mono text-[10px] text-amber-500 font-bold">
              +
            </div>
            <h3 className="font-sans text-sm font-semibold text-white tracking-tight">
              Log Practice Flaw
            </h3>
          </div>
          <span className="font-mono text-[9px] text-[#5b647f] tracking-widest uppercase">
            remember()
          </span>
        </div>

        {isLimitReached && (
          <div className="mb-4 rounded border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
            <div className="flex gap-2 items-start">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Daily limit reached (15/15)</p>
                <p className="mt-1 text-[11px] text-amber-500/80">Upgrade to Pro Master or bypass for unlimited cognitive log storage.</p>
                <button 
                  type="button"
                  onClick={() => router.push('/pricing')}
                  className="mt-2 text-[10px] font-bold underline text-white hover:text-blue-300 transition cursor-pointer"
                >
                  Upgrade to Pro now
                </button>
              </div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-400 font-mono">
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 rounded border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] text-red-400 font-mono">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Problem Title */}
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8b949e] mb-1.5">
              Problem Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLimitReached || loading}
              className="w-full rounded border border-[#222533] bg-[#11131c] px-3 py-1.5 font-sans text-xs text-white placeholder-[#3f445b] focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-40"
              placeholder="e.g. Alien Dictionary"
              id="log-problem-title"
            />
          </div>

          {/* Pattern and Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8b949e] mb-1.5">
                Pattern/Concept
              </label>
              <select
                value={pattern}
                onChange={(e) => setPattern(e.target.value as PatternType)}
                disabled={isLimitReached || loading}
                className="w-full rounded border border-[#222533] bg-[#11131c] px-2 py-1.5 font-sans text-xs text-white focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-40"
                id="log-pattern-select"
              >
                {PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8b949e] mb-1.5">
                Difficulty
              </label>
              <div className="flex gap-1">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    disabled={isLimitReached || loading}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 text-center py-1.5 rounded font-sans text-[10px] font-medium border transition-all disabled:opacity-40 ${
                      difficulty === d
                        ? d === 'Easy'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold'
                          : d === 'Medium'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold'
                          : 'bg-red-500/15 text-red-400 border-red-500/30 font-bold'
                        : 'bg-[#11131c] text-[#8b949e] border-[#222533] hover:text-white'
                    }`}
                    id={`btn-difficulty-${d.toLowerCase()}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Outcome Choice */}
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8b949e] mb-1.5">
              Practice Result / Outcome
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Solved', 'Solved with Hints', 'Failed'] as PracticeResult[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={isLimitReached || loading}
                  onClick={() => setResult(r)}
                  className={`py-1.5 px-1 rounded font-sans text-[10px] text-center border transition-all truncate leading-none disabled:opacity-40 ${
                    result === r
                      ? r === 'Solved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold'
                        : r === 'Solved with Hints'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-bold'
                        : 'bg-amber-500/15 text-amber-500 border-amber-500/30 font-bold'
                      : 'bg-[#11131c] text-[#8b949e] border-[#222533] hover:text-white'
                  }`}
                  id={`btn-result-${r.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Mistake note */}
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8b949e] mb-1.5">
              Core Mistake / Pitfall Note
            </label>
            <textarea
              required
              rows={3}
              value={mistake}
              onChange={(e) => setMistake(e.target.value)}
              disabled={isLimitReached || loading}
              className="w-full rounded border border-[#222533] bg-[#11131c] px-3 py-2 font-sans text-xs text-white placeholder-[#5b647f] focus:border-blue-500 focus:outline-none transition-colors resize-none leading-relaxed disabled:opacity-40"
              placeholder="Explain the specific logic slip. (e.g. 'Struggled with state transition row index boundary check...')"
              id="log-mistake-textarea"
            />
          </div>
        </form>
      </div>

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !mistake.trim() || isLimitReached || loading}
          className="w-full bg-[#181a25] hover:bg-blue-600 text-white border border-[#2c2f42] hover:border-blue-400/20 py-2.5 rounded font-sans text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:bg-[#181a25] disabled:hover:border-[#2c2f42] cursor-pointer"
          id="log-submit-button"
        >
          {loading ? (
            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <PlusCircle className="h-3.5 w-3.5 text-blue-400 group-hover:text-white" />
          )}
          <span>{loading ? 'Structuring memory...' : 'Commit Mistake Note'}</span>
        </button>
      </div>
    </div>
  );
}
