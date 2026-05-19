const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const BASE = rawBase.replace(/\/+$/,'');

function buildUrl(path) {
  const normalizedBase = BASE;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedBase.toLowerCase().endsWith('/api') && normalizedPath.toLowerCase().startsWith('/api')) {
    return `${normalizedBase}${normalizedPath.slice(4)}`;
  }
  return `${normalizedBase}${normalizedPath}`;
}

async function apiFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('spades_token') : null;
  const res = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json') || contentType.includes('+json');

  let data;
  if (text.trim().length === 0) {
    data = null;
  } else if (isJson) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error(`Invalid JSON response from ${BASE}${path}: ${err.message}`);
    }
  } else {
    throw new Error(
      `Unexpected non-JSON response from ${BASE}${path}: ${text.slice(0, 240)}`
    );
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status} ${res.statusText}`);
  }

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
