// client-react/src/components/ProfileEdit.jsx
import React, { useState, useEffect } from 'react';

export default function ProfileEdit({ user, onCancel, onSave, busy = false }) {
  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    bio: user?.bio ?? ''
  });

  // Reset form when user changes
  useEffect(() => {
    setForm({
      username: user?.username ?? '',
      email: user?.email ?? '',
      bio: user?.bio ?? ''
    });
  }, [user]);

  return (
    <div className="profile-edit" style={{ marginTop: 12, padding: 15, border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9' }}>
      <h4>Edytuj profil</h4>

      <label className="field">
        <span>Username</span>
        <input
          autoFocus
          value={form.username}
          onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
        />
      </label>

      <label className="field" style={{ marginTop: 8 }}>
        <span>Email</span>
        <input
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
        />
      </label>

      <label className="field" style={{ marginTop: 8 }}>
        <span>Bio</span>
        <textarea
          rows={4}
          value={form.bio}
          onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
        />
      </label>

      <div className="actions" style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button type="button" className="secondary" onClick={onCancel} disabled={busy}>Anuluj</button>
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={busy}
        >
          {busy ? 'Zapisuję…' : 'Zapisz'}
        </button>
      </div>
    </div>
  );
}