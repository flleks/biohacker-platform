// client-react/src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout, onOpenLogin }) {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <div className="navbar-content">
        <div className="brand" onClick={() => navigate('/')}>
          <div className="logo-icon"></div>
          <span>Biohacker Platform</span>
        </div>
        
        <div className="nav-right" style={{display:'flex', alignItems:'center', gap:15}}>
          {user ? (
            <>
              <div 
                onClick={() => navigate(`/profile/${user.username}`)}
                className="nav-profile-btn"
              >
                <div className="user-avatar small">
                  {(user.username || 'U')[0].toUpperCase()}
                </div>
                <div style={{fontWeight:600, fontSize:'0.9rem', color:'#e6edf3', paddingRight: 5}}>
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