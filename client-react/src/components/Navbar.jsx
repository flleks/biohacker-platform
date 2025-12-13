// client-react/src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getBaseUrl } from '../api'; // ZMIANA: import

export default function Navbar({ 
  user, onLogout, onOpenLogin,
  isDarkMode, toggleTheme,
  isLargeText, toggleTextSize
}) {
  const navigate = useNavigate();

  // ZMIANA: Helper do URL awatara
  const avatarSrc = user?.avatarUrl 
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${getBaseUrl()}${user.avatarUrl}`)
    : null;

  return (
    <div className="navbar">
      <div className="navbar-content">
        <div className="brand" onClick={() => navigate('/')}>
          <div className="logo-icon"></div>
          <span>Biohacker Platform</span>
        </div>
        
        <div className="nav-right">
          
          <div className="nav-tools">
            <button 
              className="btn-icon" 
              onClick={toggleTheme}
              title={isDarkMode ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
              style={{background: 'transparent', border:'none', fontSize: '1.2rem', cursor:'pointer'}}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            <button 
              className="btn-icon" 
              onClick={toggleTextSize}
              title={isLargeText ? "Zmniejsz czcionkę" : "Zwiększ czcionkę"}
              style={{
                background: 'transparent', border:'none', fontSize: '1rem', fontWeight:'bold', 
                cursor:'pointer', color: 'var(--text-main)',
                display: 'flex', alignItems: 'center'
              }}
            >
              {isLargeText ? 'A-' : 'A+'}
            </button>
          </div>

          {user ? (
            <>
              <div 
                onClick={() => navigate(`/profile/${user.username}`)}
                className="nav-profile-btn"
              >
                {/* ZMIANA: Logika wyświetlania obrazka w tle */}
                <div 
                  className="user-avatar small"
                  style={{
                    backgroundImage: avatarSrc ? `url(${avatarSrc})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: avatarSrc ? 'transparent' : 'inherit'
                  }}
                >
                  {!avatarSrc && (user.username || 'U')[0].toUpperCase()}
                </div>
                
                <div style={{fontWeight:600, fontSize:'0.9rem', color:'var(--text-main)', paddingRight: 5}}>
                  {user.username}
                </div>
              </div>

              <button 
                className="btn-secondary btn-round"
                onClick={onLogout} 
              >
                Wyloguj
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn-secondary btn-round" 
                onClick={() => onOpenLogin('login')}
              >
                Zaloguj
              </button>
              <button 
                className="btn-primary btn-round" 
                onClick={() => onOpenLogin('register')}
                style={{boxShadow: '0 0 15px rgba(0, 230, 118, 0.25)'}}
              >
                Rejestracja
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}