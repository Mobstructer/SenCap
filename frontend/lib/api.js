const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function apiFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('spades_token') : null;
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (body) => apiFetch('/api/auth/register', { method: 'POST', body }),
  login: (body) => apiFetch('/api/auth/login', { method: 'POST', body }),
  me: () => apiFetch('/api/auth/me'),
  updateWallet: (walletAddress) => apiFetch('/api/auth/wallet', { method: 'PUT', body: { walletAddress } }),
  leaderboard: () => apiFetch('/api/stats/leaderboard'),
  myStats: () => apiFetch('/api/stats/me'),
};
