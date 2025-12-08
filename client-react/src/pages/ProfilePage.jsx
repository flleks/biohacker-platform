// client-react/src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import PostCard from '../components/PostCard';     // Używamy tego samego komponentu co w Home
import ProfileEdit from '../components/ProfileEdit'; // Przywrócony komponent edycji

export default function ProfilePage({ me }) {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Edycja profilu
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const userOut = await api(`/api/users/${username}`);
      setProfile(userOut.user);
      
      const postsOut = await api(`/api/posts?author=${userOut.user._id}`);
      setPosts(postsOut.posts || []);
    } catch (e) {
      setError('Nie znaleziono użytkownika');
    } finally {
      setLoading(false);
    }
  }

  // Pełna aktualizacja profilu (username, email, bio)
  async function handleSaveProfile(formData) {
    setBusy(true);
    try {
      const updated = await api(`/api/users/${profile._id}`, {
        method: 'PUT',
        body: formData,
        auth: true
      });
      setProfile(updated.user);
      setIsEditing(false);
      // Opcjonalnie: jeśli zmieniłeś username, wypadałoby przekierować na nowy URL, 
      // ale dla uproszczenia zostawmy odświeżenie.
    } catch (e) {
      alert(e.message || 'Błąd zapisu');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="container">Ładowanie...</div>;
  if (error) return <div className="container">{error}</div>;
  if (!profile) return null;

  const isOwner = me && me._id === profile._id;

  return (
    <div className="container">
      <div className="layout">
        <div style={{ width: '100%' }}>
          
          <section className="card" style={{ marginBottom: 20 }}>
            {isEditing ? (
                // TRYB EDYCJI: Używamy dedykowanego komponentu
                <ProfileEdit 
                    user={profile} 
                    onCancel={() => setIsEditing(false)} 
                    onSave={handleSaveProfile} 
                    busy={busy} 
                />
            ) : (
                // TRYB PODGLĄDU
                <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ width: 80, height: 80, background: '#ddd', borderRadius: '50%', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    {profile.username[0].toUpperCase()}
                    </div>
                    <h2>{profile.username}</h2>
                    <div className="muted">{profile.email}</div>
                    <div style={{ margin: '15px 0', fontStyle: 'italic', whiteSpace:'pre-wrap' }}>
                        {profile.bio || 'Brak opisu profilu.'}
                    </div>
                    
                    {isOwner && (
                        <button className="secondary" onClick={() => setIsEditing(true)}>Edytuj profil</button>
                    )}
                </div>
            )}
          </section>

          <h3>Posty użytkownika ({posts.length})</h3>
          <ul className="list">
            {posts.map(p => (
              <PostCard 
                key={p._id} 
                post={p} 
                currentUser={me} 
                // Po edycji/usunięciu odświeżamy widok profilu
                onUpdate={fetchProfile} 
                onDelete={(id) => setPosts(prev => prev.filter(x => x._id !== id))} 
              />
            ))}
            {posts.length === 0 && <div className="muted">Ten użytkownik nie dodał jeszcze postów.</div>}
          </ul>

        </div>
      </div>
    </div>
  );
}