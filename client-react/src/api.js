const defaultBase = import.meta.env.VITE_API_BASE || localStorage.getItem('baseUrl') || 'http://localhost:4000';

export function getBaseUrl() {
  return localStorage.getItem('baseUrl') || defaultBase;
}

export function setBaseUrl(url) {
  localStorage.setItem('baseUrl', url);
}

export function getToken() {
  return localStorage.getItem('token') || '';
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const base = getBaseUrl();
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data;
}


