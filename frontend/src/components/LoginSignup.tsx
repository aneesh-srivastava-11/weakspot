"use client";

import React, { useState } from 'react';
import { ShieldAlert, Code2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';
import { setToken } from '../lib/auth';
import { useRouter } from 'next/navigation';

interface LoginSignupProps {
  initialEmail?: string;
}

export default function LoginSignup({ initialEmail = '' }: LoginSignupProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await api.login(email, password);
      } else {
        res = await api.signup(email, password);
      }

      // Store jwt
      setToken(res.token);

      // Redirect user to dashboard
      router.push('/');
      
      // Force page refresh to update all client contexts
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-6 py-12" id="login-signup-page">
      <div className="w-full max-w-sm rounded-xl border border-[#1b1e2c] bg-[#0e1017] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-[#272a37] bg-[#11131c] mb-3">
            <Code2 className="h-5 w-5 text-amber-500" />
          </div>
          <h2 className="font-sans text-xl font-semibold text-white tracking-tight">
            {isLogin ? 'Sign in to WeakSpot' : 'Create developer account'}
          </h2>
          <p className="mt-2 font-mono text-[11px] text-[#5b647f]">
            {isLogin ? 'RESUME PATTERN-FAILURE TELEMETRY' : 'INITIALIZE PRACTICE DATABASE ENGINE'}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8b949e] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-[#272a37] bg-[#11131c] px-3.5 py-2 font-sans text-xs text-white placeholder-[#3f445b] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="e.g. key_master@leetcode.com"
              required
              id="auth-email-input"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8b949e]">
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  className="font-sans text-[10px] text-[#5b647f] hover:text-[#8b949e] transition cursor-pointer"
                  onClick={() => setError('Passwords are fully hashed using bcrypt. Resetting is out of scope. Feel free to just log in/sign up!')}
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-[#272a37] bg-[#11131c] pl-3.5 pr-10 py-2 font-sans text-xs text-white placeholder-[#3f445b] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Password"
                required
                id="auth-password-input"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-[#5b647f] hover:text-[#8b949e] cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/20 py-2 px-4 rounded font-sans text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 mt-6 cursor-pointer"
            id="auth-submit-btn"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                {isLogin ? 'Sign In to Instance' : 'Provision Account'}
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle View */}
        <div className="mt-6 text-center border-t border-[#1b1e2c] pt-5">
          <p className="font-sans text-[11px] text-[#8b949e]">
            {isLogin ? "First time using WeakSpot?" : "Already registered?"}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition cursor-pointer"
              id="auth-toggle-link"
            >
              {isLogin ? 'Create an account' : 'Log in to existing'}
            </button>
          </p>
        </div>

        {/* Technical Footer Decoration */}
        <div className="mt-6 text-center">
          <span className="font-mono text-[9px] text-[#3f445b]">
            SECURE BCRYPT + JWT AUTH INSTALLED
          </span>
        </div>
      </div>
    </div>
  );
}
