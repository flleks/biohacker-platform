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

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLargeText, setIsLargeText] = useState(false);

  useEffect(() => {
    loadMe();
    
    // Odczyt z localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    
    const savedSize = localStorage.getItem('textSize');
    if (savedSize === 'large') setIsLargeText(true);
  }, []);

  // --- POPRAWKA: Nakładanie klas na HTML, a nie BODY ---
  useEffect(() => {
    const html = document.documentElement;
    
    // Motyw
    if (isDarkMode) {
      html.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }

    // Czcionka
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
    toggleTheme: () => setIsDarkMode(!isDarkMode),
    isLargeText, 
    toggleTextSize: () => setIsLargeText(!isLargeText)
  };

  if (checkingAuth) {
    return <div style={{ padding: 20 }}>Ładowanie aplikacji...</div>;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar 
          user={me} 
          onLogout={handleLogout} 
          onOpenLogin={openAuth} 
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