"use client";

import React, { useState, useEffect } from 'react';
import BillingUsage from '../../components/BillingUsage';
import ClientWrapper from '../../components/ClientWrapper';
import { UserState } from '../../types';
import { getUserFromToken, getGeminiKey } from '../../lib/auth';
import { api } from '../../lib/api';

export default function BillingPage() {
  const [userState, setUserState] = useState<UserState>({
    email: null,
    tier: 'Free',
    geminiApiKey: null,
    logsCountToday: 0
  });

  useEffect(() => {
    const user = getUserFromToken();
    const apiKey = getGeminiKey();

    if (user) {
      api.getGraph().then((data) => {
        setUserState({
          email: user.email,
          tier: data.userState.tier,
          geminiApiKey: apiKey,
          logsCountToday: data.userState.logsCountToday
        });
      }).catch((err) => {
        setUserState({
          email: user.email,
          tier: user.tier === 'pro' ? 'Pro' : 'Free',
          geminiApiKey: apiKey,
          logsCountToday: 0
        });
      });
    }
  }, []);

  return (
    <ClientWrapper userState={userState}>
      <BillingUsage userState={userState} />
    </ClientWrapper>
  );
}
