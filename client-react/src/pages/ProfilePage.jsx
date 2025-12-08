// client-react/src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, getBaseUrl } from '../api';
import PostCard from '../components/PostCard';
import ProfileEdit from '../components/ProfileEdit';

export default function ProfilePage({ me }) {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetchProfile(); }, [username]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const userOut = await api(`/api/users/${username}`);
      setProfile(userOut.user);
      const postsOut = await api(`/api/posts?author=${userOut.user._id}`);
      setPosts(postsOut.posts || []);
    } catch (e) { setError('Nie znaleziono użytkownika'); } finally { setLoading(false); }
  }

  async function handleSaveProfile(formData) {
    setBusy(true);
    try {
      const updated = await api(`/api/users/${profile._id}`, { method: 'PUT', body: formData, auth: true });
      setProfile(updated.user); setIsEditing(false);
    } catch (e) { alert('Błąd zapisu'); } finally { setBusy(false); }
  }

  function Avatar({ name, size = 100 }) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #21262d, #30363d)',
        border: '3px solid #30363d', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, color: '#fff', fontWeight: 'bold', margin: '0 auto',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
      }}>
        {(name || '?')[0].toUpperCase()}
      </div>
    );
  }

  if (loading) return <div className="container" style={{justifyContent:'center', alignItems:'center'}}>Ładowanie...</div>;
  if (error) return <div className="container" style={{justifyContent:'center'}}>{error}</div>;
  if (!profile) return null;

  const isOwner = me && me._id === profile._id;

  return (
    <div className="container">
      {/* Kontener wyśrodkowany */}
      <div className="profile-layout">
        
        {/* Karta Profilu - szerokość 600px */}
        <section className="card profile-content" style={{textAlign: 'center', padding: '40px 20px'}}>
          {!isEditing ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <Avatar name={profile.username} />
              </div>
              <h1 style={{ marginBottom: 5, fontSize:'2rem' }}>{profile.username}</h1>
              <div style={{color:'#00e676', marginBottom: 20}}>{profile.email}</div>
              
              <div style={{ maxWidth: 400, margin: '0 auto 30px', color: '#e6edf3', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {profile.bio || 'Brak opisu.'}
              </div>

              <div style={{ display: 'flex', gap: 30, justifyContent: 'center', borderTop: '1px solid #30363d', paddingTop: 20 }}>
                <div>
                  <strong style={{ fontSize: '1.5rem', display: 'block', color:'#fff' }}>{posts.length}</strong>
                  <span className="muted">Postów</span>
                </div>
              </div>

              {isOwner && (
                <div style={{ marginTop: 25 }}>
                  <button className="secondary" onClick={() => setIsEditing(true)}>Edytuj profil</button>
                </div>
              )}
            </>
          ) : (
            <ProfileEdit user={profile} onCancel={() => setIsEditing(false)} onSave={handleSaveProfile} busy={busy} />
          )}
        </section>

        {/* Lista Postów - szerokość 600px */}
        <div className="profile-content">
          <h3 style={{ marginBottom: 20, borderLeft: '4px solid #00e676', paddingLeft: 12, color:'#fff' }}>
            Posty użytkownika
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {posts.length > 0 ? posts.map(p => (
              <PostCard 
                key={p._id} 
                post={p} 
                currentUser={me} 
                onUpdate={fetchProfile} 
                onDelete={(id) => setPosts(prev => prev.filter(x => x._id !== id))} 
              />
            )) : (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: '#8b949e' }}>
                Ten użytkownik nie dodał jeszcze żadnych postów.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}