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
      const u = await api(`/api/users/${username}`);
      setProfileUser(u);
      const p = await api(`/api/posts?user=${u._id}`);
      setPosts(p.posts || []);
    } catch (e) { console.error(e); }
  }

  if (!profileUser) return <div className="container" style={{textAlign:'center', marginTop:50}}>Ładowanie...</div>;

  const isMe = me && me.username === profileUser.username;

  return (
    <div className="container">
      <div className="profile-layout">
        
        <div className="profile-content">
          {/* Karta Profilu */}
          <div className="box" style={{textAlign:'center', padding:40, position:'relative'}}>
             <div className="user-avatar" style={{width:120, height:120, fontSize:'3rem', margin:'0 auto 20px', border:'4px solid #30363d'}}>
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

          {/* Modal Edycji */}
          {isEditing && (
            <ProfileEdit 
              user={profileUser} 
              onClose={()=>setIsEditing(false)} 
              onSave={async () => { await loadProfile(); if(onUpdateMe) onUpdateMe(); setIsEditing(false); }} 
            />
          )}

          <h3 style={{marginTop:30, marginBottom:20, paddingLeft:10, borderLeft:'4px solid #00e676'}}>Wpisy użytkownika</h3>
          
          <div style={{display:'flex', flexDirection:'column', gap:20}}>
            {posts.map(p => (
               <div key={p._id} className="box" style={{padding:0, border:'none', background:'transparent', boxShadow:'none'}}>
                  <PostCard post={p} currentUser={me} onUpdate={loadProfile} onDelete={loadProfile} />
               </div>
            ))}
            {posts.length === 0 && <div className="muted">Brak wpisów.</div>}
          </div>

        </div>

      </div>
    </div>
  );
}