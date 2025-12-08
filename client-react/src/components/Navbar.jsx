// client-react/src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout, onOpenLogin }) {
  const navigate = useNavigate();

  function Avatar({ name }) {
    return (
      <div style={{
        width:38, height:38, borderRadius:'50%', background:'#21262d',
        border:'1px solid #30363d', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', fontWeight:'bold', color:'#fff'
      }}>
        {(name || 'U')[0].toUpperCase()}
      </div>
    );
  }

  return (
    <div className="navbar">
      <div className="navbar-content">
        <div className="brand" onClick={() => navigate('/')}>
          <div className="logo-icon"></div>
          <span style={{fontSize:'1.2rem', letterSpacing:'-0.5px'}}>Biohacker Platform</span>
        </div>
        
        <div className="nav-right" style={{display:'flex', alignItems:'center', gap:15}}>
          {user ? (
            <>
              <div 
                onClick={() => navigate(`/profile/${user.username}`)}
                style={{
                    display:'flex', alignItems:'center', gap:10, cursor:'pointer', 
                    padding:'4px 10px', borderRadius:20, transition:'0.2s',
                    background: 'rgba(255,255,255,0.05)'
                }}
              >
                <div style={{textAlign:'right', lineHeight:1.2, display:'none', sm:{display:'block'} }}>
                  <div style={{fontWeight:600, fontSize:'0.9rem', color:'#e6edf3'}}>{user.username}</div>
                </div>
                <Avatar name={user.username} />
              </div>

              {/* Standardowy przycisk wylogowania bez dziwnych ikon */}
              <button 
                className="secondary"
                onClick={onLogout} 
                style={{ borderRadius: 99, fontSize: '0.9rem', padding: '8px 20px' }}
              >
                Wyloguj
              </button>
            </>
          ) : (
            <>
              <button className="secondary" onClick={() => onOpenLogin('login')} style={{borderRadius: 99}}>Zaloguj</button>
              <button onClick={() => onOpenLogin('register')} style={{boxShadow: '0 0 15px rgba(0, 230, 118, 0.25)', borderRadius: 99}}>Rejestracja</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}