// client-react/src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';
import Footer from './components/Footer'; // <--- DODANO IMPORT STOPKI

import { api, getToken, setToken } from './api';
import './styles.css'; 

export default function App() {
  const [me, setMe] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Inicjalizacja motywu z localStorage (zapobiega miganiu jasnego tła przy odświeżaniu)
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

  // Efekt nakładający klasy .light-mode i .large-text na element <html>
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

    // Obsługa rozmiaru czcionki
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
      {/* ZMIANA: Flex container ustawiony w kolumnę na pełną wysokość ekranu */}
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        <Navbar 
          user={me} 
          onLogout={handleLogout} 
          onOpenLogin={openAuth} 
          {...themeProps} 
        />

        {/* ZMIANA: Ten div zajmuje całą dostępną przestrzeń (flex: 1), wypychając stopkę na dół */}
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home me={me} {...themeProps} />} />
            <Route path="/profile/:username" element={<ProfilePage me={me} {...themeProps} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* ZMIANA: Dodanie komponentu Footer na samym dole kontenera */}
        <Footer />

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