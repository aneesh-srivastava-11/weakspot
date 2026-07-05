"use client";

import React, { useState, useEffect } from 'react';
import LoginSignup from '../../components/LoginSignup';
import { getToken } from '../../lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.push('/');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center font-mono text-xs text-blue-400">
        Booting WeakSpot compiler instance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] flex flex-col justify-center items-center py-12 px-6">
      <LoginSignup />
    </div>
  );
}
