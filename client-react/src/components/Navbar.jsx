// client-react/src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout, onOpenLogin }) {
  const navigate = useNavigate();

  function Avatar({ name }) {
    return (
      <div style={{
        width:34, height:34, borderRadius:'50%', background:'#21262d', 
        border:'1px solid #30363d', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:'bold', color:'#fff'
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
          <span>Biohacker Platform</span>
        </div>
        
        <div className="nav-right">
          {user ? (
            <>
              <div 
                onClick={() => navigate(`/profile/${user.username}`)}
                style={{display:'flex', alignItems:'center', gap:12, cursor:'pointer', padding:'6px 12px', borderRadius:20}}
              >
                <div style={{textAlign:'right', lineHeight:1.2}}>
                  <div style={{fontSize:'0.75rem', color:'#8b949e'}}>Witaj</div>
                  <div style={{fontWeight:600, fontSize:'0.9rem', color:'#fff'}}>{user.username}</div>
                </div>
                <Avatar name={user.username} />
              </div>
              <button className="secondary" onClick={onLogout} style={{padding:'8px 16px', borderRadius: 99}}>Wyloguj</button>
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