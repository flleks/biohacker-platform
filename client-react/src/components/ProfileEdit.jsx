// client-react/src/components/ProfileEdit.jsx
import React, { useState, useEffect } from 'react';

export default function ProfileEdit({ user, onCancel, onSave, busy = false }) {
  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    bio: user?.bio ?? ''
  });

  useEffect(() => {
    setForm({
      username: user?.username ?? '',
      email: user?.email ?? '',
      bio: user?.bio ?? ''
    });
  }, [user]);

  return (
    <div className="profile-edit-clean">
      <h3 style={{marginBottom: 24, textAlign:'center'}}>Edytuj Profil</h3>

      <div style={{ display:'flex', justifyContent:'center', marginBottom: 24 }}>
         <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #21262d, #161b22)',
            border: '1px solid #30363d', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', color: '#fff', fontWeight: 'bold'
         }}>
            {(form.username || '?')[0].toUpperCase()}
         </div>
      </div>

      <div className="field">
        <span>Nazwa użytkownika</span>
        <input value={form.username} onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))} />
      </div>

      <div className="field">
        <span>Adres Email</span>
        <input value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
      </div>

      <div className="field">
        <span>Bio (O mnie)</span>
        <textarea
          rows={4}
          value={form.bio}
          onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Opowiedz o swoich celach biohakingowych..."
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 30, justifyContent: 'center' }}>
        <button type="button" className="secondary" onClick={onCancel} disabled={busy} style={{width:'120px'}}>Anuluj</button>
        <button type="button" onClick={() => onSave(form)} disabled={busy} style={{width:'160px'}}>
          {busy ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </button>
      </div>
    </div>
  );
}