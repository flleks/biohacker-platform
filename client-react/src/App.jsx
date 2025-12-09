import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importujemy nasze nowe komponenty
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';

// Import funkcji API
import { api, getToken, setToken } from './api';
import './styles.css'; // Zakładam, że styles.css został bez zmian

export default function App() {
  const [me, setMe] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Sprawdź przy starcie, czy mamy token i pobierz usera
  useEffect(() => {
    loadMe();
  }, []);

  async function loadMe() {
    setCheckingAuth(true);
    const token = getToken();
    if (!token) {
      setMe(null);
      setCheckingAuth(false);
      return;
    }
    try {
      const out = await api('/api/auth/me', { auth: true });
      setMe(out.user);
    } catch (e) {
      // Jeśli token wygasł lub jest zły -> wyloguj
      console.error("Session expired", e);
      setToken('');
      setMe(null);
    } finally {
      setCheckingAuth(false);
    }
  }

  function handleLogout() {
    setToken('');
    setMe(null);
    // Przekieruj na główną (opcjonalnie)
    window.location.href = '/';
  }

  function openAuth(tab = 'login') {
    setAuthTab(tab);
    setAuthModalOpen(true);
  }

  if (checkingAuth) {
    return <div style={{ padding: 20 }}>Ładowanie aplikacji...</div>;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Nawigacja zawsze widoczna na górze */}
        <Navbar 
          user={me} 
          onLogout={handleLogout} 
          onOpenLogin={openAuth} 
        />

        {/* Routing - tutaj zmienia się treść w zależności od adresu */}
        <Routes>
          <Route path="/" element={<Home me={me} />} />
          <Route path="/profile/:username" element={<ProfilePage me={me} />} />
          
          {/* Przekierowanie nieznanych adresów na Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Modal logowania dostępny globalnie */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setAuthModalOpen(false)}
          initialMode={authTab}
          onLoginSuccess={() => {
            loadMe(); // Odśwież stan 'me' po zalogowaniu
          }}
        />
      </div>
    </BrowserRouter>
  );
}