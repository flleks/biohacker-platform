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

  useEffect(() => { loadProfile(); }, [username]);

  async function loadProfile() {
    try {
      const userRes = await api(`/api/users/${username}`);
      const user = userRes.user; 
      if (!user) return; 

      setProfileUser(user);
      
      const postsRes = await api(`/api/posts?user=${user._id}`);
      let userPosts = postsRes.posts || [];
      
      // Filtrujemy, żeby na pewno były tylko tego usera
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

  return (
    <div className="container">
      {/* Używamy układu .layout (Grid) - identycznie jak na Home */}
      <div className="layout">
        
        {/* Lewy odstęp */}
        <div className="layout-left-spacer"></div>

        {/* Środkowa kolumna - max 600px */}
        <div className="main-column">
          
          {/* --- KARTA PROFILU --- */}
          {/* Dodano klasę .card, żeby miała tło */}
          <div className="card" style={{textAlign:'center', padding:40, position:'relative', marginBottom: 30}}>
             <div className="user-avatar large">
               {profileUser.username[0].toUpperCase()}
             </div>
             <h1 style={{margin:0, fontSize:'2rem'}}>{profileUser.username}</h1>
             <p className="muted" style={{marginTop:8, fontSize:'1rem'}}>{profileUser.bio || "Brak opisu biohackera."}</p>
             
             {isMe && (
               <button className="secondary" onClick={()=>setIsEditing(true)} style={{marginTop:20, padding:'8px 20px', borderRadius:99}}>
                 Edytuj profil
               </button>
             )}
          </div>

          {/* Modal Edycji Profilu */}
          {isEditing && (
            <ProfileEdit 
              user={profileUser} 
              onClose={()=>setIsEditing(false)} 
              onSave={handleProfileUpdate} 
            />
          )}

          {/* --- NAGŁÓWEK SEKCJI WPISÓW --- */}
          <div style={{marginBottom: 20, paddingLeft: 10, borderLeft: '4px solid #00e676'}}>
             <h3 style={{margin:0}}>Wpisy użytkownika</h3>
          </div>
          
          {/* --- LISTA POSTÓW --- */}
          <div style={{display:'flex', flexDirection:'column'}}>
            {posts.map(p => (
              /* Renderujemy PostCard. W pliku PostCard.jsx ma on wrapper <div className="card">, 
                 więc tło musi się pojawić, jeśli działa styles.css */
              <PostCard 
                key={p._id} 
                post={p} 
                currentUser={me} 
                onUpdate={loadProfile} 
                onDelete={loadProfile} 
              />
            ))}
            
            {posts.length === 0 && (
                <div className="card" style={{textAlign:'center', padding: 30, color: '#8b949e'}}>
                    Ten użytkownik nie dodał jeszcze żadnych wpisów.
                </div>
            )}
          </div>

        </div>

        {/* Prawy odstęp */}
        <div className="sidebar"></div>

      </div>
    </div>
  );
}