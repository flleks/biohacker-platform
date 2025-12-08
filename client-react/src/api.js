// client-react/src/api.js

// Pobieramy adres z .env (Vite) lub domyślnie localhost
const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

// Helper: Pobierz URL (dla obrazków itp.)
export function getBaseUrl() {
  return BASE_URL;
}

// Token trzymamy w localStorage (prosta implementacja dla inżynierki)
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

// Główna funkcja fetchująca
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

  // Obsługa pustych odpowiedzi (np. 204 No Content)
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    // Jeśli token wygasł (401), możemy opcjonalnie wyczyścić go tutaj
    if (res.status === 401) {
      // setToken(null); // Opcjonalnie: wyloguj automatycznie
    }
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }

  return data;
}