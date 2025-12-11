// client-react/src/api.js

const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export function getBaseUrl() {
  return BASE_URL;
}

export function getToken() {
  return localStorage.getItem('token') || '';
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  
  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    // POPRAWKA: Automatyczne wylogowanie przy 401 (token expired/invalid)
    // Jest to dobra praktyka w aplikacjach SPA
    if (res.status === 401) {
      setToken(null);
      // Opcjonalnie: można tu dodać event/dispatch, żeby UI od razu zareagowało,
      // ale window.location w komponencie App.jsx obsłuży to przy przeładowaniu
      // lub przy kolejnym requeście loadMe.
    }
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }

  return data;
}