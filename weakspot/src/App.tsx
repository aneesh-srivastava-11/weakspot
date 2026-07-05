import React, { useState } from 'react';
import Header from './components/Header';
import LandingPricing from './components/LandingPricing';
import LoginSignup from './components/LoginSignup';
import Onboarding from './components/Onboarding';
import LogPanel from './components/LogPanel';
import CheckPanel from './components/CheckPanel';
import WeakSpotsMap from './components/WeakSpotsMap';
import ActivityLogTerminal from './components/ActivityLogTerminal';
import BillingUsage from './components/BillingUsage';

import { 
  PracticeLog, 
  TerminalLog, 
  UserState, 
  ActiveScreen, 
  PatternType,
  PracticeResult 
} from './types';
import { 
  INITIAL_LOGS, 
  INITIAL_TERMINAL_LOGS 
} from './data';

import { Sparkles, Code2, Shield, RefreshCw, Key, LogIn, AlertCircle } from 'lucide-react';

export default function App() {
  // Screens / Routing state
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('Dashboard');

  // Core Data States
  const [logs, setLogs] = useState<PracticeLog[]>(INITIAL_LOGS);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>(INITIAL_TERMINAL_LOGS);
  
  // Track patterns flagged as mastered (for the forget logic)
  const [masteredPatterns, setMasteredPatterns] = useState<Record<PatternType, boolean>>({});
  
  // State for Check Panel selected pattern
  const [selectedPattern, setSelectedPattern] = useState<PatternType>('Sliding Window');

  // User subscription/quota state
  const [userState, setUserState] = useState<UserState>({
    email: 'developer@weakspot.ai', // Pre-logged in by default for a smoother first turn
    tier: 'Free',
    geminiApiKey: 'AIzaSyDemoKeyV4_60724',
    logsCountToday: 8
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

  // Add Log Handler (remember / improve action)
  const handleAddLog = (newLogFields: Omit<PracticeLog, 'id' | 'timestamp'>) => {
    const newId = `log-${Date.now()}`;
    const freshLog: PracticeLog = {
      ...newLogFields,
      id: newId,
      timestamp: new Date()
    };

    // Update Logs
    setLogs(prev => [freshLog, ...prev]);

    // Increment daily usage counts
    setUserState(prev => ({
      ...prev,
      logsCountToday: prev.logsCountToday + 1
    }));

    // If they previously mastered this pattern but failed/hinted again, clear the mastered flag!
    const isProblemSuccessful = freshLog.result === 'Solved';
    if (!isProblemSuccessful && masteredPatterns[freshLog.pattern]) {
      setMasteredPatterns(prev => ({
        ...prev,
        [freshLog.pattern]: false
      }));
      addTerminalLog('system', `system(): Regressed on mastered pattern "${freshLog.pattern}". Active weak-spot flag restored.`);
    }

    // Telemetry generation
    if (isProblemSuccessful) {
      addTerminalLog('system', `system(): Solved "${freshLog.problemTitle}" with absolute mastery. Clear parameters maintained.`);
    } else {
      const patternFailures = logs.filter(l => l.pattern === freshLog.pattern && l.result !== 'Solved').length + 1;
      
      if (patternFailures === 1) {
        addTerminalLog('remember', `remember(): Flagged weak spot on "${freshLog.pattern}" concept. Logged failure in "${freshLog.problemTitle}".`);
      } else {
        addTerminalLog('improve', `improve(): Failure frequency escalated on "${freshLog.pattern}" (${patternFailures} logs). Expanding map node dimensions.`);
      }
    }
  };

  // Check History Handler (recall action)
  const handleRecallTriggered = (pattern: PatternType) => {
    const matches = logs.filter(l => l.pattern === pattern && l.result !== 'Solved').length;
    const isPatMastered = !!masteredPatterns[pattern];
    
    if (isPatMastered) {
      addTerminalLog('recall', `recall(): Pattern "${pattern}" matches local cache: status CLEAR (mastered). Safe to advance.`);
    } else if (matches > 0) {
      addTerminalLog('recall', `recall(): Pattern "${pattern}" flagged: active weak spot. Returned ${matches} historic pitfall parameters.`);
    } else {
      addTerminalLog('recall', `recall(): Pattern "${pattern}" matches local cache: status CLEAR (zero failures). Safe to advance.`);
    }
  };

  // Mastered / Forgetting Handler (forget action)
  const handleMarkMastered = (pattern: PatternType) => {
    setMasteredPatterns(prev => ({
      ...prev,
      [pattern]: true
    }));
    
    addTerminalLog('forget', `forget(): Marked "${pattern}" as mastered. Deleted diagnostic warning nodes. Memory slot cleared.`);
  };

  // Onboarding Key Save
  const handleSaveApiKey = (key: string) => {
    setUserState(prev => ({
      ...prev,
      geminiApiKey: key
    }));
    addTerminalLog('system', `system(): API key registered. Initialized local vector compilation. Secure gateway open.`);
    setActiveScreen('Dashboard');
  };

  // Tier Subscription Change
  const handleSelectTier = (tier: 'Free' | 'Pro') => {
    setUserState(prev => ({
      ...prev,
      tier
    }));
    addTerminalLog('system', `system(): License changed to ${tier.toUpperCase()}. Adjusted thread quotas and API gates.`);
  };

  // Reset to Factory Configuration (Developer reset helper)
  const handleResetData = () => {
    setLogs(INITIAL_LOGS);
    setTerminalLogs(INITIAL_TERMINAL_LOGS);
    setMasteredPatterns({});
    setUserState({
      email: 'developer@weakspot.ai',
      tier: 'Free',
      geminiApiKey: 'AIzaSyDemoKeyV4_60724',
      logsCountToday: 5
    });
    setSelectedPattern('Sliding Window');
    addTerminalLog('system', 'system(): Flawed memory cache recycled to default factory template states.');
  };

  // Authenticate user session
  const handleLoginSuccess = (email: string) => {
    setUserState(prev => ({
      ...prev,
      email
    }));
    addTerminalLog('system', `system(): Session authenticated for developer <${email}>. Syncing cloud logs...`);
    setActiveScreen('Dashboard');
  };

  // Terminate user session
  const handleLogout = () => {
    setUserState({
      email: null,
      tier: 'Free',
      geminiApiKey: null,
      logsCountToday: 0
    });
    setLogs([]);
    setMasteredPatterns({});
    addTerminalLog('system', 'system(): Session destroyed. Disconnected safe node telemetry channels.');
    setActiveScreen('Login');
  };

  const activeWeakSpotsCount = logs.filter(
    l => l.result !== 'Solved' && !masteredPatterns[l.pattern]
  ).reduce((acc, log) => {
    if (!acc.includes(log.pattern)) {
      acc.push(log.pattern);
    }
    return acc;
  }, [] as PatternType[]).length;

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f1f5f9] flex flex-col justify-between" id="app-viewport">
      
      {/* Simulation/Quick Toolbar */}
      <div className="bg-[#11131c] border-b border-[#1b1e2c] px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-[#8b949e] text-[10px]">PREVIEW SIMULATOR:</span>
          <span className="font-mono text-white text-[10px] bg-[#181a25] border border-[#272a37] px-2 py-0.5 rounded">
            Role: {userState.email ? `LoggedIn (${userState.tier})` : 'LoggedOut'}
          </span>
        </div>
        
        {/* Quick actions for testing each screen requested */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[#5b647f] text-[10px]">GO TO SCREEN:</span>
          <div className="flex rounded-md bg-[#090a0f] border border-[#1e2230] p-0.5">
            {[
              { screen: 'Dashboard', label: '1. Dashboard' },
              { screen: 'Pricing', label: '2. Pricing' },
              { screen: 'Login', label: '3. Auth/Form' },
              { screen: 'Onboarding', label: '4. API Key setup' }
            ].map(item => (
              <button
                key={item.screen}
                onClick={() => {
                  if (item.screen === 'Login' && userState.email) {
                    // simulate logout to see auth
                    setUserState(prev => ({ ...prev, email: null }));
                    addTerminalLog('system', 'system(): Developer session disconnected for auth testing.');
                  }
                  setActiveScreen(item.screen as ActiveScreen);
                }}
                className={`px-2 py-1 rounded font-mono text-[9px] transition ${
                  activeScreen === item.screen 
                    ? 'bg-blue-600 text-white font-bold' 
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Persistent Navigation */}
      <Header
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        userState={userState}
        onLogout={handleLogout}
        onSimulateLogin={() => {
          setActiveScreen('Login');
          addTerminalLog('system', 'system(): Loading minimal security gate screen.');
        }}
        activeWeakSpotsCount={activeWeakSpotsCount}
      />

      {/* Primary Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        
        {/* Guarding dashboard checks: if user is not logged in but tries to access Dashboard, we prompt login */}
        {activeScreen === 'Dashboard' && !userState.email && (
          <div className="max-w-md mx-auto text-center py-16 border border-[#1b1e2c] bg-[#0c0d12] rounded-xl p-8 space-y-4">
            <LogIn className="h-10 w-10 text-blue-400 mx-auto" />
            <h3 className="font-sans text-base font-bold text-white">Active Session Required</h3>
            <p className="font-sans text-xs text-[#8b949e] max-w-xs mx-auto leading-relaxed">
              WeakSpot maintains localized encryption keys. Please login or register to initialize the core problem analysis matrix.
            </p>
            <button
              onClick={() => setActiveScreen('Login')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold py-2 px-6 rounded border border-blue-400/25 transition cursor-pointer"
            >
              Sign In Now
            </button>
          </div>
        )}

        {/* 1. Dashboard screen */}
        {activeScreen === 'Dashboard' && userState.email && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="dashboard-bento-grid">
            
            {/* Left Bento: Log Entry Panel & Activity Log Terminal */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="flex-none">
                <LogPanel 
                  onAddLog={handleAddLog} 
                  userState={userState}
                  onUpgradePrompt={() => {
                    setActiveScreen('Pricing');
                    addTerminalLog('system', 'system(): Logs capacity exceeded. Routed to pricing options.');
                  }}
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
                  onRecallTriggered={handleRecallTriggered}
                  selectedPattern={selectedPattern}
                  setSelectedPattern={setSelectedPattern}
                />
              </div>
              <div className="flex-1 min-h-[420px]">
                <WeakSpotsMap 
                  logs={logs}
                  masteredPatterns={masteredPatterns}
                  selectedPattern={selectedPattern}
                  onSelectPattern={setSelectedPattern}
                  onResetAllLogs={handleResetData}
                />
              </div>
            </div>

          </div>
        )}

        {/* 2. Landing / Pricing Screen */}
        {activeScreen === 'Pricing' && (
          <LandingPricing 
            userState={userState}
            onSelectTier={handleSelectTier}
            onNavigateToOnboarding={() => setActiveScreen('Onboarding')}
          />
        )}

        {/* 3. Auth Form Screen */}
        {activeScreen === 'Login' && (
          <LoginSignup 
            onLoginSuccess={handleLoginSuccess}
            initialEmail={userState.email || ''}
          />
        )}

        {/* 4. Onboarding (API Key entry) Screen */}
        {activeScreen === 'Onboarding' && (
          <Onboarding 
            apiKey={userState.geminiApiKey}
            onSaveApiKey={handleSaveApiKey}
            onUpgradeToPro={() => {
              handleSelectTier('Pro');
              setActiveScreen('Dashboard');
            }}
            onBack={() => setActiveScreen('Pricing')}
          />
        )}

        {/* 5. Billing & Usage Screen */}
        {activeScreen === 'Billing' && (
          <BillingUsage 
            userState={userState}
            onUpgradeToPro={() => handleSelectTier('Pro')}
            onDowngradeToFree={() => handleSelectTier('Free')}
            onNavigateToOnboarding={() => setActiveScreen('Onboarding')}
          />
        )}

      </main>

      {/* Standardized professional workspace footer */}
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
            <a href="#github-mock" className="hover:text-[#5b647f] transition">DOCUMENTATION</a>
            <span>•</span>
            <a href="#api-mock" className="hover:text-[#5b647f] transition">API_GATEWAY</a>
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
