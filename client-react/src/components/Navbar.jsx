import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout, onOpenLogin }) {
  const navigate = useNavigate();

  function Avatar({ name, size = 30 }) {
    const initials = (name || 'U').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
    return <div className="avatar" style={{width:size,height:size, display:'flex', alignItems:'center', justifyContent:'center', background:'#e5e7eb', borderRadius:'50%', fontSize:'0.8rem'}}>{initials}</div>;
  }

  return (
    <div className="navbar">
      <div className="brand" style={{cursor:'pointer'}} onClick={() => navigate('/')}>
        <span className="logo"></span> Biohacker
      </div>
      <div className="nav-right">
        {user ? (
          <>
            <span className="muted">Zalogowany jako</span>
            <div style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}} onClick={() => navigate(`/profile/${user.username}`)}>
              <Avatar name={user.username} />
              <strong>{user.username}</strong>
            </div>
            <button className="secondary" onClick={onLogout} style={{marginLeft:10}}>Wyloguj</button>
          </>
        ) : (
          <>
            <span className="muted">Niezalogowany</span>
            <button className="secondary" onClick={() => onOpenLogin('login')}>Zaloguj</button>
            <button onClick={() => onOpenLogin('register')}>Zarejestruj</button>
          </>
        )}
      </div>
    </div>
  );
}