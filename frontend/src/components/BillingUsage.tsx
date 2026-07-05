"use client";

import React, { useState } from 'react';
import { CreditCard, Sparkles, Check, Key, ChevronRight } from 'lucide-react';
import { UserState } from '../types';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { clearToken, clearGeminiKey } from '../lib/auth';

interface BillingUsageProps {
  userState: UserState;
}

export default function BillingUsage({
  userState
}: BillingUsageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const percentage = Math.min((userState.logsCountToday / 15) * 100, 100);
  const isFree = userState.tier === 'Free';

  const handleDowngrade = async () => {
    setLoading(true);
    try {
      // Direct call to simulate-toggle endpoint in development environment
      await api.simulateToggle('free');
      
      // Clear personal key as well so it's fresh
      clearGeminiKey();

      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12" id="billing-usage-page">
      {/* Page Title */}
      <div className="mb-10">
        <h2 className="font-sans text-2xl font-semibold text-white tracking-tight">
          Subscription & Engine Usage
        </h2>
        <p className="mt-1 font-sans text-xs text-[#8b949e]">
          Manage API gateways, daily computational capacity, and subscription configurations.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Tier Overview Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#1b1e2c] bg-[#0c0d12] p-6">
            <h3 className="font-sans text-sm font-semibold text-white mb-4">Plan Status</h3>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#11131c] border border-[#1e2230] mb-6">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${
                  isFree 
                    ? 'border-[#272a37] bg-[#0c0d12] text-[#8b949e]' 
                    : 'border-blue-500/20 bg-blue-500/5 text-blue-400 glow-blue'
                }`}>
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-semibold text-white">
                    {isFree ? 'Free Developer Plan' : 'Pro Master Plan'}
                  </h4>
                  <p className="font-mono text-[9px] text-[#5b647f]">
                    {isFree ? 'LIMITED COMPUTATION GATEWAY' : 'MANAGED ZERO-KEY ARCHITECTURE'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-sans text-xs font-bold text-white block">
                  {isFree ? '₹0/mo' : '₹499/mo'}
                </span>
                <span className="font-mono text-[9px] text-[#5b647f]">
                  {isFree ? 'Permanent' : 'Renews monthly'}
                </span>
              </div>
            </div>

            {/* If Free: show interactive usage meter */}
            {isFree ? (
              <div className="space-y-4" id="usage-meter-container">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-[#8b949e] uppercase tracking-wider">Daily Log Telemetry Usage</span>
                  <span className="text-white font-bold">{userState.logsCountToday} / 15 Logs</span>
                </div>
                
                <div className="w-full bg-[#171a25] rounded-full h-2 overflow-hidden border border-[#1d202e]">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-start pt-1">
                  <p className="font-sans text-[11px] text-[#5b647f] max-w-sm">
                    {15 - userState.logsCountToday} logs remaining before AI parsing throttling engages. Add a Gemini API Key to continue processing mistakes.
                  </p>
                  
                  <button
                    onClick={() => router.push('/pricing')}
                    className="font-sans text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition ml-4 cursor-pointer"
                    id="btn-billing-upgrade-inline"
                  >
                    <span>Upgrade</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              /* If Pro: show unlimited, high capacity status indicators */
              <div className="space-y-4" id="pro-stats-container">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded border border-[#1e2230] bg-[#090a0f] space-y-1">
                    <span className="font-mono text-[9px] text-[#5b647f] block uppercase tracking-wider">Log quota status</span>
                    <span className="font-sans text-xs font-semibold text-[#10b981]">UNLIMITED</span>
                  </div>
                  <div className="p-3.5 rounded border border-[#1e2230] bg-[#090a0f] space-y-1">
                    <span className="font-mono text-[9px] text-[#5b647f] block uppercase tracking-wider">Diagnostic frequency</span>
                    <span className="font-sans text-xs font-semibold text-white">REAL_TIME</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded bg-emerald-500/5 border border-emerald-500/10 p-3 text-xs text-emerald-400">
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    All API computations are fully managed by WeakSpot. Standard keyless deep diagnostics are unlocked across all your programming environments.
                  </p>
                </div>

                <div className="pt-2 flex justify-start border-t border-[#1e2230] mt-4">
                  <button
                    onClick={handleDowngrade}
                    disabled={loading}
                    className="font-sans text-[10px] text-[#5b647f] hover:text-red-400 hover:underline transition cursor-pointer disabled:opacity-50"
                    id="btn-downgrade-simulate"
                  >
                    {loading ? 'Downgrading...' : 'Downgrade to Free tier (Simulate Free experience)'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Gemini Key Config Card for Free Users */}
          {isFree && (
            <div className="rounded-xl border border-[#1b1e2c] bg-[#0c0d12] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-sans text-sm font-semibold text-white mb-1">
                    Developer API Gateway
                  </h3>
                  <p className="font-sans text-xs text-[#8b949e]">
                    Manage credentials utilized for processing failure vectors in client-side mode.
                  </p>
                </div>
                <Key className="h-4 w-4 text-blue-400" />
              </div>

              <div className="p-4 rounded bg-[#090a0f] border border-[#1e2230] flex items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-[10px] text-[#8b949e] uppercase block">
                    GEMINI_API_KEY
                  </span>
                  <span className="font-mono text-[11px] text-white mt-1 block max-w-[200px] truncate">
                    {userState.geminiApiKey ? '••••••••••••' + userState.geminiApiKey.slice(-4) : 'NO_KEY_REGISTERED'}
                  </span>
                </div>

                <button
                  onClick={() => router.push('/onboarding')}
                  className="px-3 py-1.5 rounded border border-[#272a37] bg-transparent font-sans text-xs text-[#c9d1d9] hover:bg-[#11131c] hover:text-white transition cursor-pointer shrink-0"
                  id="btn-billing-configure-key"
                >
                  Configure
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pro features list sidebar */}
        <div className="rounded-xl border border-[#1b1e2c] bg-[#0c0d12] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-4 text-blue-400 font-mono text-[11px]">
              <Sparkles className="h-3 w-3" />
              <span>PRO UPGRADE MODULES</span>
            </div>
            
            <h3 className="font-sans text-sm font-semibold text-white mb-3">
              Unlock Cognitive Mastery
            </h3>
            <p className="font-sans text-xs text-[#8b949e] leading-relaxed mb-6">
              Empower your practice with high-frequency telemetry and advanced structural compiler insights:
            </p>

            <ul className="space-y-3.5 text-xs text-[#c9d1d9]">
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Unlimited logs & recall checking queries</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Fully managed high-throughput API gateway</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Advanced multidimensional pattern maps</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Weekly automated flaw summaries & recommendations</span>
              </li>
            </ul>
          </div>

          {isFree && (
            <div className="mt-8">
              <button
                onClick={() => router.push('/pricing')}
                className="w-full text-center text-xs font-semibold py-2 bg-blue-600 hover:bg-blue-500 text-white rounded border border-blue-400/20 transition cursor-pointer"
                id="btn-billing-upgrade-pro"
              >
                Upgrade Plan for ₹499/mo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
