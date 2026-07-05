import React from 'react';
import { Code2, Cpu, Sparkles, Terminal, LogOut, CheckCircle2 } from 'lucide-react';
import { ActiveScreen, UserState } from '../types';

interface HeaderProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  userState: UserState;
  onLogout: () => void;
  onSimulateLogin: () => void;
  activeWeakSpotsCount: number;
}

export default function Header({
  activeScreen,
  setActiveScreen,
  userState,
  onLogout,
  onSimulateLogin,
  activeWeakSpotsCount
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1b1e2c] bg-[#090a0f]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Left Side: Logo & Brand */}
        <div 
          onClick={() => setActiveScreen('Dashboard')} 
          className="flex cursor-pointer items-center gap-2.5 transition hover:opacity-90"
          id="logo-brand"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#272a37] bg-[#11131c]">
            <Code2 className="h-4.5 w-4.5 text-amber-500" />
            <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div>
            <span className="font-sans text-sm font-semibold tracking-tight text-white">WeakSpot</span>
            <span className="ml-1.5 font-mono text-[9px] text-[#5b647f] uppercase border border-[#1e2230] px-1 py-0.5 rounded">v1.0</span>
          </div>
        </div>

        {/* Center: Main Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-xs">
          {[
            { id: 'Dashboard', label: 'Dashboard' },
            { id: 'Pricing', label: 'Pricing / Plans' },
            { id: 'Billing', label: 'Usage & Billing' },
          ].map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id as ActiveScreen)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  isActive
                    ? 'bg-[#181a25] text-white border border-[#26293a]'
                    : 'text-[#8b949e] hover:text-white hover:bg-[#11131c]'
                }`}
                id={`nav-${item.id.toLowerCase()}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Side: Tier Badge & Avatar Status */}
        <div className="flex items-center gap-3">
          {userState.email ? (
            <>
              {/* Active alerts counter */}
              {activeWeakSpotsCount > 0 && (
                <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/5 font-mono text-[10px] text-amber-500">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                  </span>
                  <span>{activeWeakSpotsCount} Weak Spot{activeWeakSpotsCount > 1 ? 's' : ''}</span>
                </div>
              )}

              {/* Tier badge */}
              <div 
                onClick={() => setActiveScreen('Billing')}
                className={`cursor-pointer px-2 py-0.5 rounded font-mono text-[10px] font-bold tracking-wider transition ${
                  userState.tier === 'Pro'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 glow-blue'
                    : 'bg-[#181a25] text-[#8b949e] border border-[#272a37]'
                }`}
                title="Click to view subscription"
                id="tier-badge"
              >
                {userState.tier.toUpperCase()} TIER
              </div>

              {/* User Identity / Sim */}
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#272a37] flex items-center justify-center text-xs font-semibold text-white uppercase">
                  {userState.email[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-sans text-[11px] font-medium text-[#c9d1d9] leading-none truncate max-w-[120px]">
                    {userState.email}
                  </p>
                  <p className="text-[9px] font-mono text-[#5b647f]">Active Session</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1 rounded hover:bg-[#181a25] text-[#8b949e] hover:text-red-400 transition ml-1"
                  title="Logout"
                  id="btn-logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveScreen('Pricing')}
                className="hidden sm:block text-xs font-medium text-[#8b949e] hover:text-white px-3 py-1.5 transition"
              >
                Pricing
              </button>
              <button
                onClick={onSimulateLogin}
                className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/20 px-3 py-1.5 rounded-md transition"
                id="btn-login-header"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
