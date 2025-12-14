import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api, getBaseUrl } from '../api';
import PostCard from '../components/PostCard';
import ProfileEdit from '../components/ProfileEdit';

export default function ProfilePage({ me, onUpdateMe }) {
  const { username } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profileUser, setProfileUser] = useState(null);
  const [totalViews, setTotalViews] = useState(0);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  // --- FILTROWANIE ---
  const filterType = searchParams.get('type') || 'all';
  const sortOrder = searchParams.get('sort') || 'newest';

  const handleFilterChange = (newType) => {
    const newParams = new URLSearchParams(searchParams);
    if (newType === 'all') newParams.delete('type');
    else newParams.set('type', newType);
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort) => {
    const newParams = new URLSearchParams(searchParams);
    if (newSort === 'newest') newParams.delete('sort');
    else newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  const getBtnStyle = (isActive) => ({
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: '0.85rem',
    border: isActive ? 'none' : '1px solid var(--border)',
    background: isActive ? 'var(--accent)' : 'var(--bg-input)',
    color: isActive ? '#000' : 'var(--text-main)',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s'
  });

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (profileUser) {
      loadPosts();
    }
  }, [profileUser, filterType, sortOrder]);

  async function loadProfile() {
    try {
      const res = await api(`/api/users/${username}`);
      if (!res.user) return; 

      setProfileUser(res.user);
      setTotalViews(res.data?.totalViews || res.totalViews || 0);
    } catch (e) { console.error(e); }
  }

  async function loadPosts() {
    if (!profileUser) return;
    try {
      const params = new URLSearchParams();
      params.append('author', profileUser._id);
      
      if (filterType !== 'all') params.append('type', filterType);
      if (sortOrder !== 'newest') params.append('sort', sortOrder);

      const res = await api(`/api/posts?${params.toString()}`);
      setPosts(res.posts || []);
      setVisibleCount(10);
    } catch (e) { console.error(e); }
  }

  const handlePostUpdate = () => loadPosts();

  // --- POPRAWIONA FUNKCJA USUWANIA ---
  const handlePostDelete = (id) => {
    // 1. Znajdź post, który usuwamy, żeby pobrać jego liczbę wyświetleń
    const postToDelete = posts.find(p => p._id === id);
    
    // 2. Jeśli post istnieje, odejmij jego wyświetlenia od sumy
    if (postToDelete) {
        const viewsToRemove = postToDelete.views || 0;
        setTotalViews(prev => Math.max(0, prev - viewsToRemove));
    }

    // 3. Usuń post z listy
    setPosts(prev => prev.filter(p => p._id !== id));
  };

  async function handleProfileUpdate() {
    await loadProfile();
    if (onUpdateMe) onUpdateMe();
    setIsEditing(false);
  }

  if (!profileUser) return (
    <div className="container" style={{textAlign:'center', marginTop:50, color:'var(--text-main)'}}>
        Ładowanie profilu...
    </div>
  );

  const isMe = me && me.username === profileUser.username;
  const visiblePosts = posts.slice(0, visibleCount);

  const profileAvatar = profileUser?.avatarUrl 
    ? (profileUser.avatarUrl.startsWith('http') ? profileUser.avatarUrl : `${getBaseUrl()}${profileUser.avatarUrl}`)
    : null;

  return (
    <div className="container">
      <div className="layout">
        
        <div className="layout-left-spacer"></div>

        <div className="main-column">
          
          <div className="card" style={{textAlign:'center', padding:40, position:'relative', marginBottom: 20}}>
             <div 
               className="user-avatar large"
               style={{
                 backgroundImage: profileAvatar ? `url(${profileAvatar})` : 'none',
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 color: profileAvatar ? 'transparent' : 'inherit'
               }}
             >
               {!profileAvatar && profileUser.username[0].toUpperCase()}
             </div>

             <h1 style={{margin:0, fontSize:'2rem', color: 'var(--text-main)'}}>{profileUser.username}</h1>
             <p className="muted" style={{marginTop:8, fontSize:'1rem'}}>{profileUser.bio || "Brak opisu biohackera."}</p>
             
             {/* STATYSTYKI */}
             <div style={{
                 marginTop: 15, 
                 display: 'flex', 
                 justifyContent: 'center', 
                 gap: 20, 
                 fontSize: '0.9rem', 
                 color: 'var(--text-muted)'
             }}>
                <div>📝 <strong>{posts.length}</strong> Wpisów</div>
                <div>👁️ <strong>{totalViews}</strong> Wyświetleń</div>
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

          {/* --- GŁÓWNY KONTENER (FILTRY + LISTA) --- */}
          <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
               
               {/* GÓRA: Nagłówek i Filtry */}
               <div style={{ padding: '15px' }}>
                   <h3 className="box-title" style={{marginBottom: 10}}>Wpisy użytkownika {profileUser.username}</h3>

                   <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                       <div style={{display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'}}>
                           <span style={{fontSize:'0.8rem', color:'var(--text-muted)', fontWeight: 600, minWidth: 50}}>POKAŻ:</span>
                           <button onClick={()=>handleFilterChange('all')} style={getBtnStyle(filterType==='all')}>
                               Wszystkie
                           </button>
                           <button onClick={()=>handleFilterChange('experiment')} style={getBtnStyle(filterType==='experiment')}>
                               🧪 Eksperymenty
                           </button>
                           <button onClick={()=>handleFilterChange('normal')} style={getBtnStyle(filterType==='normal')}>
                               📝 Wpisy
                           </button>
                       </div>

                       {/* LINIA 1 */}
                       <div style={{height: 1, background: 'var(--border)', width: '100%', opacity: 0.5}}></div>

                       <div style={{display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'}}>
                           <span style={{fontSize:'0.8rem', color:'var(--text-muted)', fontWeight: 600, minWidth: 50}}>SORTUJ:</span>
                           <button onClick={()=>handleSortChange('newest')} style={getBtnStyle(sortOrder==='newest')}>
                               🆕 Najnowsze
                           </button>
                           <button onClick={()=>handleSortChange('popular')} style={getBtnStyle(sortOrder==='popular')}>
                               🔥 Popularne
                           </button>
                       </div>
                   </div>
               </div>

               {/* LINIA 2 - Z MARGINESAMI */}
               <div style={{height: 1, background: 'var(--border)', margin: '0 15px', opacity: 0.5}}></div>

               <div style={{ padding: '15px', background: 'var(--bg-card)' }}>
                    <div style={{display:'flex', flexDirection:'column', gap: 20}}>
                      {visiblePosts.map(p => (
                        <PostCard 
                          key={p._id} 
                          post={p} 
                          currentUser={me} 
                          onUpdate={loadPosts} 
                          onDelete={handlePostDelete} // Przekazujemy nową funkcję
                        />
                      ))}
                      
                      {posts.length === 0 && (
                          <div className="text-center" style={{padding: 30, color: 'var(--text-muted)'}}>
                              <div style={{fontSize:'2rem', marginBottom:10}}>🔍</div>
                              Brak wpisów dla wybranych filtrów.
                          </div>
                      )}

                      {visibleCount < posts.length && (
                          <button 
                            onClick={() => setVisibleCount(prev => prev + 10)}
                            style={{
                              width: '100%', padding: '12px 0', marginTop: 15,
                              background: 'var(--bg-input)', border: '1px solid var(--border)',
                              borderRadius: 8, color: 'var(--text-main)', fontWeight: 600,
                              cursor: 'pointer', transition: 'background 0.2s'
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
    </div>
  );
}