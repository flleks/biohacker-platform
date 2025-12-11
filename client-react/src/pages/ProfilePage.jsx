// client-react/src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import PostCard from '../components/PostCard';
import ProfileEdit from '../components/ProfileEdit';

export default function ProfilePage({ me, onUpdateMe }) {
  const { username } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    setVisibleCount(10);
    loadProfile();
  }, [username]);

  async function loadProfile() {
    try {
      const userRes = await api(`/api/users/${username}`);
      const user = userRes.user; 
      if (!user) return; 

      setProfileUser(user);
      
      const postsRes = await api(`/api/posts?user=${user._id}`);
      let userPosts = postsRes.posts || [];
      
      userPosts = userPosts.filter(p => p.author && p.author._id === user._id);
      
      setPosts(userPosts);
    } catch (e) { console.error(e); }
  }

  async function handleProfileUpdate() {
    await loadProfile();
    if (onUpdateMe) onUpdateMe();
    setIsEditing(false);
  }

  if (!profileUser) return <div className="container" style={{textAlign:'center', marginTop:50}}>Ładowanie profilu...</div>;

  const isMe = me && me.username === profileUser.username;
  const visiblePosts = posts.slice(0, visibleCount);

  return (
    <div className="container">
      <div className="layout">
        
        <div className="layout-left-spacer"></div>

        <div className="main-column">
          
          <div className="card" style={{textAlign:'center', padding:40, position:'relative', marginBottom: 30}}>
             <div className="user-avatar large">
               {profileUser.username[0].toUpperCase()}
             </div>
             <h1 style={{margin:0, fontSize:'2rem'}}>{profileUser.username}</h1>
             <p className="muted" style={{marginTop:8, fontSize:'1rem'}}>{profileUser.bio || "Brak opisu biohackera."}</p>
             
             <div style={{marginTop: 15, color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                Liczba wpisów: <strong style={{color: 'var(--text-main)'}}>{posts.length}</strong>
             </div>

             {isMe && (
               <button className="btn-secondary" onClick={()=>setIsEditing(true)} style={{marginTop:20, padding:'8px 20px', borderRadius:99}}>
                 Edytuj profil
               </button>
             )}
          </div>

          {isEditing && (
            <ProfileEdit 
              user={profileUser} 
              onClose={()=>setIsEditing(false)} 
              onSave={handleProfileUpdate} 
            />
          )}

          {/* POPRAWKA: Zamiana sztywnych kolorów na zmienne var(--) */}
          <div style={{ padding: 15, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
            
            <div style={{marginBottom: 20, paddingLeft: 10, borderLeft: '4px solid var(--accent)'}}>
               <h3 style={{margin:0, color: 'var(--text-main)'}}>Wpisy użytkownika</h3>
            </div>
            
            <div style={{display:'flex', flexDirection:'column', gap: 20}}>
              {visiblePosts.map(p => (
                <PostCard 
                  key={p._id} 
                  post={p} 
                  currentUser={me} 
                  onUpdate={loadProfile} 
                  onDelete={loadProfile} 
                />
              ))}
              
              {posts.length === 0 && (
                  <div className="text-center" style={{padding: 20, color: 'var(--text-muted)'}}>
                      Ten użytkownik nie dodał jeszcze żadnych wpisów.
                  </div>
              )}

              {visibleCount < posts.length && (
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 10)}
                    style={{
                      width: '100%', 
                      padding: '12px 0', 
                      marginTop: 15,
                      background: 'var(--bg-input)', // Poprawiony kolor
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text-main)', // Poprawiony kolor
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseOut={e => e.currentTarget.style.background = 'var(--bg-input)'}
                  >
                    ⬇ Pokaż więcej ({posts.length - visibleCount})
                  </button>
              )}
            </div>
          </div>

        </div>

        

      </div>
    </div>
  );
}