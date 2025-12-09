// client-react/src/components/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import { api, setToken } from '../api';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onLoginSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setUsername('');
      setEmail('');
      setPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const isLogin = mode === 'login';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin ? { email, password } : { username, email, password };
      const data = await api(endpoint, { method: 'POST', body });

      if (data.token) {
        setToken(data.token);
        if (onLoginSuccess) onLoginSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Wystąpił błąd.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()}
        style={{maxWidth: 400, padding: '40px 30px', position: 'relative'}}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: 15, right: 15, 
            width: 32, height: 32, padding: 0, borderRadius: '50%',
            background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem'
          }}
        >
          ✕
        </button>

        <div style={{textAlign: 'center', marginBottom: 25}}>
           <div style={{fontSize: '3rem', marginBottom: 10}}>
             {isLogin ? '🔐' : '🧬'}
           </div>
           <h2 style={{margin: 0, fontSize: '1.8rem', color: 'var(--text-main)'}}>
             {isLogin ? 'Witaj ponownie' : 'Dołącz do nas'}
           </h2>
           <p className="muted" style={{marginTop: 8}}>
             {isLogin ? 'Zaloguj się, aby kontynuować.' : 'Rozpocznij swoją przygodę z biohackingiem.'}
           </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--bg-danger)', border: '1px solid rgba(255, 60, 60, 0.3)', 
            color: 'var(--text-danger)', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="field">
              <span>Nazwa użytkownika</span>
              <input 
                type="text" placeholder="Np. BioHacker01"
                value={username} onChange={e => setUsername(e.target.value)} required autoFocus={!isLogin}
              />
            </div>
          )}

          <div className="field">
            <span>Email</span>
            <input 
              type="email" placeholder="twoj@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required autoFocus={isLogin}
            />
          </div>

          <div className="field">
            <span>Hasło</span>
            <input 
              type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required 
            />
          </div>

          <button 
            className="btn-primary"
            type="submit" disabled={busy} 
            style={{width: '100%', marginTop: 10, padding: 12, fontSize: '1rem'}}
          >
            {busy ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : 'Utwórz konto')}
          </button>
        </form>

        <div style={{marginTop: 25, textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)'}}>
          {isLogin ? 'Nie masz jeszcze konta?' : 'Masz już konto?'}
          <br/>
          <button 
            type="button"
            onClick={() => { setError(''); setMode(isLogin ? 'register' : 'login'); }}
            style={{
               color: 'var(--accent)', fontWeight: 600, marginTop: 8, 
               background: 'transparent', border: 'none', cursor: 'pointer',
               textDecoration: 'underline', textUnderlineOffset: 4
            }}
          >
            {isLogin ? 'Zarejestruj się tutaj' : 'Zaloguj się teraz'}
          </button>
        </div>

      </div>
    </div>
  );
}