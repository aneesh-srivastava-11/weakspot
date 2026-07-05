"use client";

import React, { useState, useEffect } from 'react';
import Header from './Header';
import { UserState, PracticeLog, PatternType } from '../types';
import { getUserFromToken, getGeminiKey } from '../lib/auth';
import { api } from '../lib/api';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [userState, setUserState] = useState<UserState>({
    email: null,
    tier: 'Free',
    geminiApiKey: null,
    logsCountToday: 0
  });
  const [activeWeakSpotsCount, setActiveWeakSpotsCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const user = getUserFromToken();
    const apiKey = getGeminiKey();

    if (user) {
      // Fetch fresh stats from backend
      api.getGraph().then((data) => {
        setUserState({
          email: user.email,
          tier: data.userState.tier,
          geminiApiKey: apiKey,
          logsCountToday: data.userState.logsCountToday
        });

        // Compute count of active weak spots
        const attempts: PracticeLog[] = data.attempts;
        const mastered: Record<string, boolean> = data.masteredPatterns;
        
        const activeSpots = attempts.filter(
          l => l.result !== 'Solved' && !mastered[l.pattern]
        ).reduce((acc, log) => {
          if (!acc.includes(log.pattern)) {
            acc.push(log.pattern);
          }
          return acc;
        }, [] as PatternType[]);

        setActiveWeakSpotsCount(activeSpots.length);
      }).catch((err) => {
        console.error("Failed to fetch fresh user state:", err);
        setUserState({
          email: user.email,
          tier: user.tier === 'pro' ? 'Pro' : 'Free',
          geminiApiKey: apiKey,
          logsCountToday: 0
        });
      });
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center font-mono text-xs text-blue-400">
        Booting WeakSpot compiler instance...
      </div>
    );
  }

  const handleResetData = async () => {
    if (typeof window === 'undefined') return;
    if (confirm("Reset local practice database? This will clear attempts in Postgres and trigger factory reset.")) {
      // Simply logout to clear keys
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between" id="app-viewport">
      <Header 
        userState={userState} 
        activeWeakSpotsCount={activeWeakSpotsCount}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-[#141622] bg-[#07080c] py-6 px-6 mt-16 select-none">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-[#11131c] border border-[#1b1e2c] flex items-center justify-center font-mono text-[10px] text-[#5b647f]">
              W
            </div>
            <span className="font-sans text-[11px] text-[#5b647f]">
              © 2026 WeakSpot Inc. Personal cognitive diagnostic protocols.
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-[#3f445b]">
            <span className="text-[#5b647f]">COGNEE_DB: ACTIVE</span>
            <span>•</span>
            <span className="text-[#5b647f]">POSTGRES: CONNECTED</span>
            <span>•</span>
            <button 
              onClick={handleResetData}
              className="text-amber-500/80 hover:text-amber-400 transition underline cursor-pointer"
            >
              RESTORE FACTORY SETTINGS
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
