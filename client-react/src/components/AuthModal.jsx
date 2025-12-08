// client-react/src/components/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import { api, setToken } from '../api';

export default function AuthModal({ isOpen, onClose, initialTab = 'login', onSuccess }) {
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { 
    setTab(initialTab); 
    setError('');
    setForm({ username: '', email: '', password: '' });
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault(); // Zapobiega przeładowaniu formularza
    setBusy(true); setError('');
    
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login' 
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password };
      
      const res = await api(endpoint, { method: 'POST', body });
      setToken(res.token);
      onSuccess(); 
      onClose();
    } catch (e) {
      setError(e.message || 'Wystąpił błąd. Spróbuj ponownie.');
    } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        
        <div style={{textAlign: 'center', marginBottom: 20}}>
          <h2 style={{fontSize: '1.5rem'}}>Witamy w Biohacker</h2>
          <p className="muted">Zaloguj się, aby optymalizować swoje życie.</p>
        </div>

        <div className="tabs">
          <div className={`tab ${tab==='login'?'active':''}`} onClick={()=>setTab('login')}>Logowanie</div>
          <div className={`tab ${tab==='register'?'active':''}`} onClick={()=>setTab('register')}>Rejestracja</div>
        </div>

        <form onSubmit={handleSubmit}>
           {tab === 'register' && (
             <label className="field">
               <span>Nazwa użytkownika</span>
               <input 
                 autoFocus
                 value={form.username} 
                 onChange={e=>setForm({...form, username:e.target.value})} 
                 placeholder="Twój nick"
               />
             </label>
           )}
           
           <label className="field">
             <span>Adres Email</span>
             <input 
               type="email"
               value={form.email} 
               onChange={e=>setForm({...form, email:e.target.value})} 
               placeholder="jan@example.com"
             />
           </label>
           
           <label className="field">
             <span>Hasło</span>
             <input 
               type="password" 
               value={form.password} 
               onChange={e=>setForm({...form, password:e.target.value})} 
               placeholder="••••••••"
             />
           </label>
           
           {error && (
             <div style={{
               background: 'rgba(255, 107, 107, 0.1)', 
               color: '#ff6b6b', 
               padding: '10px', 
               borderRadius: '8px', 
               fontSize: '0.9rem',
               marginBottom: '15px',
               textAlign: 'center'
             }}>
               {error}
             </div>
           )}
           
           <div style={{marginTop: 20}}>
             <button type="submit" disabled={busy} style={{width: '100%', padding: '14px'}}>
               {busy ? 'Przetwarzam...' : (tab==='login' ? 'Zaloguj się' : 'Utwórz konto')}
             </button>
             
             <button 
               type="button" 
               className="secondary" 
               onClick={onClose} 
               style={{width: '100%', marginTop: 10, background: 'transparent', border: 'none'}}
             >
               Anuluj
             </button>
           </div>
        </form>
      </div>
    </div>
  );
}