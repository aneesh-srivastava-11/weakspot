export function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('weakspot_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('weakspot_token', token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('weakspot_token');
}

export function getGeminiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('weakspot_gemini_key');
}

export function setGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('weakspot_gemini_key', key);
}

export function clearGeminiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('weakspot_gemini_key');
}

export interface DecodedUser {
  userId: string;
  email: string;
  tier: string;
}

export function getUserFromToken(): DecodedUser | null {
  const token = getToken();
  if (!token) return null;
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  return {
    userId: decoded.userId,
    email: decoded.email,
    tier: decoded.tier
  };
}
