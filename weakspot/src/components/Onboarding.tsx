import React, { useState } from 'react';
import { Key, Sparkles, CheckCircle2, ShieldAlert, ChevronRight, HelpCircle, ArrowLeft } from 'lucide-react';

interface OnboardingProps {
  apiKey: string | null;
  onSaveApiKey: (key: string) => void;
  onUpgradeToPro: () => void;
  onBack: () => void;
}

export default function Onboarding({
  apiKey,
  onSaveApiKey,
  onUpgradeToPro,
  onBack
}: OnboardingProps) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!keyInput.trim()) {
      setErrorMessage('Please enter an API key to validate.');
      setStatus('error');
      return;
    }

    if (!keyInput.startsWith('AIzaSy')) {
      setErrorMessage('Key format is invalid. Standard Gemini API keys must begin with "AIzaSy".');
      setStatus('error');
      return;
    }

    setStatus('validating');

    // Simulate validation sequence with high fidelity logs
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        onSaveApiKey(keyInput);
      }, 1000);
    }, 1800);
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-6 py-12" id="onboarding-page">
      <div className="w-full max-w-md rounded-xl border border-[#1b1e2c] bg-[#0e1017] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        
        {/* Back Link */}
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#5b647f] hover:text-[#8b949e] transition mb-6"
          id="btn-onboarding-back"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Change subscription plan</span>
        </button>

        <div className="mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/5 mb-3">
            <Key className="h-5 w-5 text-blue-400" />
          </div>
          <h2 className="font-sans text-xl font-semibold text-white tracking-tight">
            Add your Gemini API key
          </h2>
          <p className="mt-2 font-sans text-xs text-[#8b949e] leading-relaxed">
            Free tier requires a personal API key to parse problem descriptions, extract mistake patterns, and update your personal memory files.
          </p>
        </div>

        {status === 'error' && errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 rounded border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="mb-4 flex items-start gap-2.5 rounded border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <span className="font-semibold block">Key Handshake Complete</span>
              <span className="text-[11px] text-emerald-500/80">Cognitive indexing compiled. Storing session...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleValidate} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8b949e]">
                Gemini API Key
              </label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="font-mono text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 transition"
                id="get-key-link"
              >
                <span>Get a key in AI Studio</span>
                <ChevronRight className="h-3 w-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                disabled={status === 'validating' || status === 'success'}
                className="w-full rounded border border-[#272a37] bg-[#11131c] px-3.5 py-2 font-mono text-xs text-white placeholder-[#3f445b] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-60"
                placeholder="AIzaSy..."
                required
                id="gemini-key-input"
              />
            </div>
            
            <p className="mt-2 text-[10px] text-[#5b647f] leading-relaxed">
              Your API key is saved locally in your browser cache. It is never transmitted to our servers — all semantic compilations run client-side.
            </p>
          </div>

          <button
            type="submit"
            disabled={status === 'validating' || status === 'success'}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/20 py-2.5 px-4 rounded font-sans text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-75 cursor-pointer mt-6"
            id="validate-onboarding-btn"
          >
            {status === 'validating' ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="font-mono text-[11px]">gemini-3.5: handshake_check()...</span>
              </span>
            ) : status === 'success' ? (
              <span>Authenticated</span>
            ) : (
              <span>Validate & Continue</span>
            )}
          </button>
        </form>

        {/* Pro Alternative Prompt */}
        <div className="mt-8 border-t border-[#1b1e2c] pt-6 text-center">
          <p className="font-sans text-[11px] text-[#8b949e] mb-3">
            Want to avoid managing keys and hitless rate-limits?
          </p>
          <button
            onClick={onUpgradeToPro}
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition"
            id="btn-onboarding-pro-upgrade"
          >
            <Sparkles className="h-3 w-3 text-blue-400" />
            <span>Upgrade to Pro Master (Managed Infrastructure)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
