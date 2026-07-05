"use client";

import React, { useState, useEffect } from 'react';
import ClientWrapper from '../components/ClientWrapper';
import LogPanel from '../components/LogPanel';
import CheckPanel from '../components/CheckPanel';
import WeakSpotsMap from '../components/WeakSpotsMap';
import ActivityLogTerminal from '../components/ActivityLogTerminal';
import { PracticeLog, TerminalLog, UserState, PatternType } from '../types';
import { getUserFromToken, getGeminiKey } from '../lib/auth';
import { api } from '../lib/api';
import { LogIn } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  
  // Core data states loaded from API
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [masteredPatterns, setMasteredPatterns] = useState<Record<PatternType, boolean>>({} as Record<PatternType, boolean>);
  const [selectedPattern, setSelectedPattern] = useState<PatternType>('Sliding Window');
  
  // Terminal logs state
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  
  // User state
  const [userState, setUserState] = useState<UserState>({
    email: null,
    tier: 'Free',
    geminiApiKey: null,
    logsCountToday: 0
  });

  // Telemetry logger helper
  const addTerminalLog = (method: TerminalLog['method'], message: string) => {
    const newLog: TerminalLog = {
      id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date(),
      method,
      message
    };
    setTerminalLogs(prev => [...prev, newLog]);
  };

  useEffect(() => {
    const user = getUserFromToken();
    const apiKey = getGeminiKey();

    if (!user) {
      setIsLoggedIn(false);
      router.push('/login');
      return;
    }

    setIsLoggedIn(true);

    // Initial load from backend
    api.getGraph()
      .then((data) => {
        setLogs(data.attempts);
        setMasteredPatterns(data.masteredPatterns);
        setUserState({
          email: user.email,
          tier: data.userState.tier,
          geminiApiKey: apiKey,
          logsCountToday: data.userState.logsCountToday
        });

        // Initial system stdout
        const activeSpots = data.attempts.filter(
          (l: any) => l.result !== 'Solved' && !data.masteredPatterns[l.pattern]
        ).reduce((acc: string[], log: any) => {
          if (!acc.includes(log.pattern)) acc.push(log.pattern);
          return acc;
        }, []);

        setTerminalLogs([
          {
            id: 'term-init',
            timestamp: new Date(),
            method: 'system',
            message: `system(): Synchronized database state. ${activeSpots.length} weak spots active, ${8 - activeSpots.length} patterns clear. Ready.`
          }
        ]);
      })
      .catch((err) => {
        console.error("Failed to load initial graph:", err);
        addTerminalLog('system', `system(): API server sync error: ${err.message}`);
      });
  }, []);

  const handleAddLog = async (newLogFields: {
    problemTitle: string;
    pattern: PatternType;
    difficulty: any;
    result: any;
    mistakeNote: string;
  }) => {
    try {
      addTerminalLog('remember', `remember(): Ingesting coding log description for "${newLogFields.problemTitle}"...`);
      
      const res = await api.logAttempt(newLogFields);
      
      // Update local attempts history
      const newLog: PracticeLog = {
        id: res.attempt.id,
        problemTitle: res.attempt.problemTitle,
        pattern: res.attempt.pattern,
        difficulty: res.attempt.difficulty,
        result: res.attempt.result,
        mistakeNote: res.attempt.mistakeSummary || '',
        timestamp: res.attempt.createdAt,
        status: res.attempt.status
      };

      setLogs(prev => [newLog, ...prev]);
      
      // Update user today logs count
      setUserState(prev => ({
        ...prev,
        logsCountToday: res.todayLogsCount
      }));

      // If consecutive solved is 3+, it triggers mastery
      const isSolved = newLog.result === 'Solved';
      const streak = res.attempt.consecutiveCorrectCount;

      if (isSolved) {
        addTerminalLog('system', `system(): Solved "${newLog.problemTitle}" with correct parameters. Streak: ${streak}/3.`);
        if (streak >= 3) {
          addTerminalLog('improve', `improve(): Concept "${newLog.pattern}" has achieved double-pass correctness (streak: ${streak}). Marking mastered.`);
          // Update mastered state in UI
          setMasteredPatterns(prev => ({
            ...prev,
            [newLog.pattern]: true
          }));
          addTerminalLog('forget', `forget(): Marked "${newLog.pattern}" as mastered. Automatically pruned diagnostic warning nodes.`);
        }
      } else {
        // If they failed/hinted on a previously mastered pattern, it clears the mastered flag!
        if (masteredPatterns[newLog.pattern]) {
          setMasteredPatterns(prev => ({
            ...prev,
            [newLog.pattern]: false
          }));
          addTerminalLog('system', `system(): Regressed on mastered pattern "${newLog.pattern}". Active weak-spot flag restored.`);
        }

        const failures = logs.filter(l => l.pattern === newLog.pattern && l.result !== 'Solved').length + 1;
        if (failures === 1) {
          addTerminalLog('remember', `remember(): Flagged weak spot on "${newLog.pattern}" concept. Logged failure in "${newLog.problemTitle}".`);
        } else {
          addTerminalLog('improve', `improve(): Failure frequency escalated on "${newLog.pattern}" (${failures} logs). Expanding map node dimensions.`);
        }
      }
    } catch (err: any) {
      addTerminalLog('system', `system(): Error processing log: ${err.message}`);
      throw err;
    }
  };

  const handleMarkMastered = async (pattern: PatternType) => {
    try {
      await api.forget(pattern);
      setMasteredPatterns(prev => ({
        ...prev,
        [pattern]: true
      }));
    } catch (err: any) {
      addTerminalLog('system', `system(): Forget call failed: ${err.message}`);
      throw err;
    }
  };

  const handleTelemetryLog = (method: TerminalLog['method'], message: string) => {
    addTerminalLog(method, message);
  };

  // 1. Guard check if loading isLoggedIn status
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center font-mono text-xs text-blue-400">
        Booting WeakSpot compiler instance...
      </div>
    );
  }

  // 2. Guard check if user is not authenticated
  if (isLoggedIn === false) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col justify-center items-center px-6">
        <div className="max-w-md w-full text-center py-16 border border-[#1b1e2c] bg-[#0c0d12] rounded-xl p-8 space-y-4">
          <LogIn className="h-10 w-10 text-blue-400 mx-auto animate-pulse" />
          <h3 className="font-sans text-base font-bold text-white">Active Session Required</h3>
          <p className="font-sans text-xs text-[#8b949e] max-w-xs mx-auto leading-relaxed">
            WeakSpot maintains localized encryption keys. Please login or register to initialize the core problem analysis matrix.
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold py-2.5 px-6 rounded border border-blue-400/25 transition cursor-pointer"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  // 3. Render Dashboard Bento
  return (
    <ClientWrapper userState={userState}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="dashboard-bento-grid">
        
        {/* Left Bento: Log Entry Panel & Activity Log Terminal */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-none">
            <LogPanel 
              onAddLog={handleAddLog} 
              userState={userState}
            />
          </div>
          <div className="flex-1">
            <ActivityLogTerminal 
              logs={terminalLogs} 
              onClearLogs={() => setTerminalLogs([])}
            />
          </div>
        </div>

        {/* Right Bento: Pre-Check & Node Constellation map */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex-none">
            <CheckPanel 
              logs={logs}
              masteredPatterns={masteredPatterns}
              onMarkMastered={handleMarkMastered}
              selectedPattern={selectedPattern}
              setSelectedPattern={setSelectedPattern}
              onTelemetryLog={handleTelemetryLog}
            />
          </div>
          <div className="flex-1 min-h-[420px]">
            <WeakSpotsMap 
              logs={logs}
              masteredPatterns={masteredPatterns}
              selectedPattern={selectedPattern}
              onSelectPattern={setSelectedPattern}
            />
          </div>
        </div>

      </div>
    </ClientWrapper>
  );
}
