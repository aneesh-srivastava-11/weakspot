import { getToken, getGeminiKey } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const geminiKey = getGeminiKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (geminiKey) {
    headers['X-Gemini-Key'] = geminiKey;
  }

  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const cleanEndpoint = '/' + endpoint.replace(/^\/+/, '');

  const response = await fetch(`${baseUrl}${cleanEndpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  // Auth
  async signup(email: string, password: string) {
    return fetchAPI('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async login(email: string, password: string) {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  // Cognee operations
  async logAttempt(payload: {
    problemTitle: string;
    pattern: string;
    difficulty: string;
    result: string;
    mistakeNote: string;
  }) {
    return fetchAPI('/api/log-attempt', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async checkBeforeSolving(pattern: string) {
    return fetchAPI('/api/check-before-solving', {
      method: 'POST',
      body: JSON.stringify({ pattern })
    });
  },

  async improve(pattern: string) {
    return fetchAPI('/api/improve', {
      method: 'POST',
      body: JSON.stringify({ pattern })
    });
  },

  async forget(pattern: string) {
    return fetchAPI('/api/forget', {
      method: 'POST',
      body: JSON.stringify({ pattern })
    });
  },

  async validateKey(apiKey: string) {
    return fetchAPI('/api/validate-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey })
    });
  },

  // Graph / Attempt Data
  async getGraph() {
    return fetchAPI('/graph');
  },

  // Payments / Billing
  async createOrder() {
    return fetchAPI('/billing/create-order', {
      method: 'POST'
    });
  },

  async verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    return fetchAPI('/billing/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Simulation Toggle (bypass Razorpay checkout in development)
  async simulateToggle(targetTier: 'free' | 'pro') {
    return fetchAPI('/billing/simulate-toggle', {
      method: 'POST',
      body: JSON.stringify({ targetTier })
    });
  }
};
