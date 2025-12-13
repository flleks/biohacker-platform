// client-react/src/components/ProfileEdit.jsx
import React, { useState } from 'react';
import { api, setToken, getBaseUrl } from '../api'; // Dodano getBaseUrl

export default function ProfileEdit({ user, onClose, onSave }) {
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [bio, setBio] = useState(user.bio || '');
  
  // Stan dla awatara
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    user.avatarUrl 
      ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${getBaseUrl()}${user.avatarUrl}`)
      : null
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Obsługa wyboru pliku
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Tworzymy tymczasowy podgląd
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // ZMIANA: Używamy FormData zamiast JSON, aby przesłać plik
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('bio', bio);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      // UWAGA: Kiedy używamy fetch z FormData, nie ustawiamy ręcznie Content-Type!
      // Browser zrobi to sam (multipart/form-data boundary).
      // Nasza funkcja `api` w api.js domyślnie ustawia JSON, więc musimy użyć fetch bezpośrednio
      // lub zmodyfikować api.js. Tutaj użyjemy fetch bezpośrednio dla pewności.

      const token = localStorage.getItem('token');
      const res = await fetch(`${getBaseUrl()}/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Nie dodajemy Content-Type: application/json
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Błąd aktualizacji');
      }
      
      onSave(); // Odśwież dane w rodzicu
    } catch (err) {
      console.error(err);
      setError("Nie udało się zaktualizować profilu. " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Czy na pewno chcesz zainicjować procedurę całkowitego odłączenia? Twoje bio-dane i historia zostaną trwale wymazane z systemu.")) {
      return;
    }

    setBusy(true);
    try {
      await api(`/api/users/${user._id}`, {
        method: 'DELETE',
        auth: true
      });
      setToken(null);
      window.location.href = '/'; 
    } catch (err) {
      console.error(err);
      setError("Wystąpił błąd podczas usuwania konta.");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2 style={{marginTop:0}}>Edytuj Profil</h2>
        
        {error && <div style={{color:'var(--text-danger)', marginBottom:15, fontSize:'0.9rem'}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* Sekcja zmiany awatara */}
          <div style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20}}>
            <div 
              className="user-avatar large"
              style={{
                width: 80, height: 80, fontSize: '2rem', margin: 0,
                backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center'
              }}
            >
              {!previewUrl && username[0]?.toUpperCase()}
            </div>
            <div>
              <label 
                htmlFor="avatar-upload" 
                className="btn-secondary" 
                style={{cursor: 'pointer', display: 'inline-block', fontSize: '0.9rem'}}
              >
                Wybierz zdjęcie
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{display: 'none'}} 
              />
              <div className="muted" style={{marginTop: 5, fontSize: '0.8rem'}}>
                JPG, PNG, max 5MB
              </div>
            </div>
          </div>

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

          <div style={{display:'flex', gap:10, justifyContent:'space-between', marginTop:30, paddingTop: 20, borderTop: '1px solid #eee'}}>
            <button 
              type="button" 
              onClick={handleDeleteAccount} 
              disabled={busy}
              style={{
                backgroundColor: '#ff4d4f', color: 'white', border: 'none', 
                padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
              }}
            >
              Usuń konto
            </button>

            <div style={{display:'flex', gap:10}}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
                Anuluj
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}