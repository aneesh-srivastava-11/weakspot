"use client";

import React, { useState } from 'react';
import { Check, Key, Code2, Sparkles, Terminal } from 'lucide-react';
import { UserState } from '../types';
import { useRouter } from 'next/navigation';
import { loadRazorpayScript } from '../lib/razorpay';
import { api } from '../lib/api';

interface LandingPricingProps {
  userState: UserState;
}

export default function LandingPricing({
  userState
}: LandingPricingProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpgradePro = async () => {
    if (!userState.email) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Check your internet connection.');
      }

      // 1. Create order on the backend
      const orderData = await api.createOrder();

      // 2. Open Razorpay checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'WeakSpot Pro',
        description: 'Managed Infrastructure & Unlimited Logs',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            setLoading(true);
            // 3. Verify Razorpay signature on backend
            const verificationResult = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verificationResult.success) {
              if (typeof window !== 'undefined') {
                window.location.href = '/billing';
              }
            }
          } catch (err: any) {
            setError(err.message || 'Signature verification failed.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          email: userState.email
        },
        theme: {
          color: '#2563eb'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err: any) {
      setError(err.message || 'Failed to initialize checkout.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFree = () => {
    if (!userState.email) {
      router.push('/login');
    } else {
      router.push('/onboarding');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-20" id="landing-pricing-page">
      {/* Hero Section */}
      <div className="text-center mb-16 md:mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/10 bg-blue-500/5 text-[11px] font-mono text-blue-400 mb-6">
          <Sparkles className="h-3 w-3" />
          <span>Cognitive Compiler for Algorithm Prep</span>
        </div>
        
        <h1 className="font-sans text-3xl md:text-5xl font-semibold tracking-tight text-white max-w-3xl mx-auto leading-[1.15]">
          Memory that knows what you keep getting wrong — and when you've finally got it.
        </h1>
        
        <p className="mt-6 font-sans text-sm md:text-base text-[#8b949e] max-w-xl mx-auto leading-relaxed">
          WeakSpot works quietly behind your coding practice. It tracks pattern-based failures, serves critical warnings before starting new problems, and auto-forgets them the moment you prove mastery.
        </p>

        {error && (
          <div className="mt-6 max-w-md mx-auto rounded border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 font-mono text-center">
            {error}
          </div>
        )}
      </div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Tier */}
        <div 
          className={`relative rounded-xl border p-8 bg-[#0e1017] transition-all flex flex-col justify-between ${
            userState.tier === 'Free' 
              ? 'border-blue-500/40 glow-blue' 
              : 'border-[#222533] hover:border-[#30354a]'
          }`}
          id="pricing-card-free"
        >
          {userState.tier === 'Free' && (
            <span className="absolute -top-3 left-6 bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              Your Current Plan
            </span>
          )}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-lg font-medium text-white">Free Developer</h3>
              <div className="rounded border border-[#272a37] bg-[#11131c] px-2 py-0.5 font-mono text-[10px] text-[#8b949e]">
                BYO Key
              </div>
            </div>
            <p className="font-sans text-xs text-[#8b949e] mb-6">
              Connect your own developer key to leverage AI cognitive pattern analysis. Perfect for individuals.
            </p>
            
            <div className="flex items-baseline gap-1 mb-8">
              <span className="font-mono text-3xl font-semibold text-white">₹0</span>
              <span className="font-mono text-xs text-[#5b647f]">/ permanent</span>
            </div>

            <ul className="space-y-4 text-xs text-[#c9d1d9] mb-8">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>15 daily practice logs</strong> limit</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Bring Your Own Gemini API Key (validated)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Interactive Weak Spot Constellation Map</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Pattern recall & check warnings</span>
              </li>
            </ul>
          </div>

          <div>
            <button
              onClick={handleSelectFree}
              className={`w-full text-center text-xs font-medium py-2.5 px-4 rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                userState.tier === 'Free'
                  ? 'bg-transparent text-blue-400 border border-blue-500/30 hover:bg-blue-500/5'
                  : 'bg-[#181a25] text-white border border-[#272a37] hover:bg-[#202333]'
              }`}
              id="btn-pricing-free"
            >
              <Key className="h-3.5 w-3.5" />
              {userState.geminiApiKey ? 'Configure Gemini Key' : 'Configure API Key & Continue'}
            </button>
          </div>
        </div>

        {/* Pro Tier */}
        <div 
          className={`relative rounded-xl border p-8 bg-[#0e1017] transition-all flex flex-col justify-between ${
            userState.tier === 'Pro' 
              ? 'border-blue-500/40 glow-blue' 
              : 'border-[#222533] hover:border-[#30354a]'
          }`}
          id="pricing-card-pro"
        >
          {userState.tier === 'Pro' ? (
            <span className="absolute -top-3 left-6 bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              Your Current Plan
            </span>
          ) : (
            <span className="absolute -top-3 left-6 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
              Highly Recommended
            </span>
          )}
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-lg font-medium text-white flex items-center gap-1.5">
                Pro Master
              </h3>
              <div className="rounded border border-blue-500/20 bg-blue-500/5 px-2 py-0.5 font-mono text-[10px] text-blue-400">
                Managed AI
              </div>
            </div>
            <p className="font-sans text-xs text-[#8b949e] mb-6">
              Complete managed infrastructure with zero key configuration. Unlimited volume for rigorous prep.
            </p>
            
            <div className="flex items-baseline gap-1 mb-8">
              <span className="font-mono text-3xl font-semibold text-white">₹499</span>
              <span className="font-mono text-xs text-[#5b647f]">/ month</span>
            </div>

            <ul className="space-y-4 text-xs text-[#c9d1d9] mb-8">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Unlimited daily logs</strong> & checks</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>No Gemini API key configuration required</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Prioritized AI deep pattern diagnostic synthesis</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Managed high-performance Cognee memory stores</span>
              </li>
            </ul>
          </div>

          <div>
            <button
              onClick={handleUpgradePro}
              disabled={userState.tier === 'Pro' || loading}
              className={`w-full text-center text-xs font-semibold py-2.5 px-4 rounded-md transition-all cursor-pointer ${
                userState.tier === 'Pro'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/20 shadow-[0_4px_12px_rgba(37,99,235,0.2)] disabled:opacity-50'
              }`}
              id="btn-pricing-pro"
            >
              {loading ? 'Processing...' : userState.tier === 'Pro' ? 'Active Subscription' : 'Upgrade to Pro Master'}
            </button>
          </div>
        </div>
      </div>

      {/* Feature comparisons */}
      <div className="mt-16 md:mt-24 border-t border-[#1b1e2c] pt-12">
        <h4 className="font-mono text-xs font-medium text-[#5b647f] uppercase tracking-wider mb-8 text-center">
          Engine Specifications
        </h4>
        <div className="grid sm:grid-cols-3 gap-6 text-xs text-[#8b949e]">
          <div className="p-4 rounded-lg border border-[#1b1e2c] bg-[#0c0d12]">
            <h5 className="font-sans font-medium text-white mb-2">pattern() tracking</h5>
            <p className="leading-relaxed">
              Maintains high-dimensional semantic mapping of coding flaws. It captures logic faults rather than just syntax typos.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-[#1b1e2c] bg-[#0c0d12]">
            <h5 className="font-sans font-medium text-white mb-2">recall() checks</h5>
            <p className="leading-relaxed">
              Provides non-intrusive warnings when embarking on new problems matching flagged difficulty and pattern parameters.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-[#1b1e2c] bg-[#0c0d12]">
            <h5 className="font-sans font-medium text-white mb-2">forget() mastery</h5>
            <p className="leading-relaxed">
              Monitors progressive solutions. Once a clean double-pass is logged with zero hints, warnings automatically fade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
