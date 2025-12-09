// client-react/src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';

import { api, getToken, setToken } from './api';
import './styles.css'; 

export default function App() {
  const [me, setMe] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // --- POPRAWKA 1: Odczyt localStorage przy inicjalizacji (zapobiega miganiu) ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // Domyślnie ciemny (true), chyba że zapisano 'light'
    return savedTheme !== 'light';
  });

  const [isLargeText, setIsLargeText] = useState(() => {
    const savedSize = localStorage.getItem('textSize');
    return savedSize === 'large';
  });

  useEffect(() => {
    loadMe();
  }, []);

  // --- Efekt nakładający klasy na HTML ---
  useEffect(() => {
    const html = document.documentElement;
    
    // Obsługa motywu
    if (isDarkMode) {
      html.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }

    // Obsługa czcionki
    if (isLargeText) {
      html.classList.add('large-text');
      localStorage.setItem('textSize', 'large');
    } else {
      html.classList.remove('large-text');
      localStorage.setItem('textSize', 'normal');
    }
  }, [isDarkMode, isLargeText]);

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
    window.location.href = '/';
  }

  function openAuth(tab = 'login') {
    setAuthTab(tab);
    setAuthModalOpen(true);
  }

  const themeProps = {
    isDarkMode, 
    toggleTheme: () => setIsDarkMode(prev => !prev),
    isLargeText, 
    toggleTextSize: () => setIsLargeText(prev => !prev)
  };

  if (checkingAuth) {
    return <div style={{ padding: 20 }}>Ładowanie aplikacji...</div>;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* --- POPRAWKA 2: Przekazanie themeProps do Navbar --- */}
        <Navbar 
          user={me} 
          onLogout={handleLogout} 
          onOpenLogin={openAuth} 
          {...themeProps} 
        />

        <Routes>
          <Route path="/" element={<Home me={me} {...themeProps} />} />
          <Route path="/profile/:username" element={<ProfilePage me={me} {...themeProps} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setAuthModalOpen(false)}
          initialMode={authTab}
          onLoginSuccess={() => loadMe()}
        />
      </div>
    </BrowserRouter>
  );
}