import React, { useState, useEffect } from 'react';
import { api, setToken } from '../api';

export default function AuthModal({ isOpen, onClose, initialTab = 'login', onSuccess }) {
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setTab(initialTab); }, [initialTab]);

  if (!isOpen) return null;

  async function handleSubmit() {
    setBusy(true); setError('');
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login' 
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password };
      
      const res = await api(endpoint, { method: 'POST', body });
      setToken(res.token);
      onSuccess(); // odśwież usera w App
      onClose();
    } catch (e) {
      setError(e.message || 'Błąd autoryzacji');
    } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="tabs">
          <div className={`tab ${tab==='login'?'active':''}`} onClick={()=>setTab('login')}>Logowanie</div>
          <div className={`tab ${tab==='register'?'active':''}`} onClick={()=>setTab('register')}>Rejestracja</div>
        </div>
        <div style={{marginTop:15}}>
           {tab === 'register' && (
             <label className="field"><span>Username</span><input value={form.username} onChange={e=>setForm({...form, username:e.target.value})} /></label>
           )}
           <label className="field"><span>Email</span><input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></label>
           <label className="field"><span>Hasło</span><input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} /></label>
           
           {error && <div className="toast" style={{position:'static', marginTop:10}}>{error}</div>}
           
           <div className="actions" style={{marginTop:15}}>
             <button type="button" className="secondary" onClick={onClose}>Anuluj</button>
             <button onClick={handleSubmit} disabled={busy}>{busy ? 'Przetwarzam...' : (tab==='login'?'Zaloguj':'Zarejestruj')}</button>
           </div>
        </div>
      </div>
    </div>
  );
}