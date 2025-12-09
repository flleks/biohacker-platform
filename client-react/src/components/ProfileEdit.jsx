// client-react/src/components/ProfileEdit.jsx
import React, { useState } from 'react';
import { api } from '../api';

export default function ProfileEdit({ user, onClose, onSave }) {
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [bio, setBio] = useState(user.bio || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // Wysyłamy aktualizację do endpointu PUT /api/users/:id
      await api(`/api/users/${user._id}`, {
        method: 'PUT',
        auth: true,
        body: {
          username,
          email,
          bio
        }
      });
      
      // Jeśli sukces, wywołaj onSave (który odświeży widok w rodzicu)
      onSave();
    } catch (err) {
      console.error(err);
      setError("Nie udało się zaktualizować profilu. Sprawdź poprawność danych.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2 style={{marginTop:0}}>Edytuj Profil</h2>
        
        {error && <div style={{color:'#ff6b6b', marginBottom:15, fontSize:'0.9rem'}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          
          <div className="field">
            <span>Nazwa użytkownika</span>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="field">
            <span>Email</span>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="field">
            <span>Bio (Twój opis)</span>
            <textarea 
              rows={4}
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              placeholder="Napisz coś o sobie..."
            />
          </div>

          <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginTop:20}}>
            <button type="button" className="secondary" onClick={onClose} disabled={busy}>
              Anuluj
            </button>
            <button type="submit" disabled={busy}>
              {busy ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}