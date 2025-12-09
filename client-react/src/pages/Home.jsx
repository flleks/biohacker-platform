// client-react/src/pages/Home.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getBaseUrl, getToken } from '../api';
import PostCard from '../components/PostCard';

export default function Home({ me }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  
  // Stan paginacji (Load More)
  const [visibleCount, setVisibleCount] = useState(10);

  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);

  const BASIC_TAGS = ['sleep','supplements','fitness','nootropics','diet'];

  useEffect(() => { loadPosts(); }, []);

  // Reset licznika postów przy zmianie wyszukiwania
  useEffect(() => {
    setVisibleCount(10);
  }, [search]);

  async function loadPosts() {
    try { const out = await api('/api/posts'); setPosts(out.posts || []); } catch (e) { console.error(e); }
  }

  const handlePostUpdate = () => loadPosts();
  const handlePostDelete = (id) => setPosts(prev => prev.filter(p => p._id !== id));

  function toggleComposerTag(t) {
    const currentTags = postTags ? postTags.split(',').map(x => x.trim()).filter(Boolean) : [];
    const set = new Set(currentTags);
    if (set.has(t)) set.delete(t); else set.add(t);
    setPostTags(Array.from(set).join(', '));
  }
  
  const activeComposerTags = useMemo(() => {
     return postTags ? postTags.split(',').map(x => x.trim()) : [];
  }, [postTags]);

  async function createPost() {
    setBusy(true);
    try {
      const tags = postTags.split(',').map(t => t.trim()).filter(Boolean);
      const fd = new FormData();
      fd.append('content', postContent);
      fd.append('tags', JSON.stringify(tags));
      if (postImageFile) fd.append('image', postImageFile);

      const token = getToken();
      await fetch(`${getBaseUrl()}/api/posts`, { method: 'POST', headers: token ? {Authorization:`Bearer ${token}`} : {}, body: fd });
      
      setPostContent(''); setPostTags(''); 
      if (postImagePreview) URL.revokeObjectURL(postImagePreview);
      setPostImageFile(null); setPostImagePreview(null);
      setComposerOpen(false);
      
      await loadPosts();
    } catch (e) { alert('Błąd: ' + e.message); } 
    finally { setBusy(false); }
  }

  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(p => {
      const contentMatch = (p.content || '').toLowerCase().includes(q);
      const tagsMatch = (p.tags || []).some(t => t.toLowerCase().includes(q));
      return contentMatch || tagsMatch;
    });
  }, [posts, search]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  const trendingTags = useMemo(() => {
    const count = {};
    posts.forEach(p => (p.tags||[]).forEach(t => count[t] = (count[t]||0)+1));
    return Object.entries(count)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 8)
      .map(([tag, c]) => ({ tag, count: c }));
  }, [posts]);

  return (
    <div className="container">
      <div className="layout">
        
        <div className="layout-left-spacer"></div>

        <div className="main-column">
           
           {/* WYSZUKIWARKA */}
           <section className="box">
             <h3 className="box-title">Wyszukaj</h3>
             <div className="row">
                <div style={{flex:1}}>
                  <input 
                    className="search-input-styled" 
                    value={search} 
                    onChange={e=>setSearch(e.target.value)} 
                    placeholder="Wpisz frazę lub #tag..." 
                  />
                </div>
                {search && (
                  <button className="btn-secondary btn-icon" onClick={()=>setSearch('')}>
                    ✕
                  </button>
                )}
             </div>
           </section>

            {/* --- PASEK TWORZENIA POSTA --- */}
            {me && (
              <div 
                className="box" 
                onClick={() => setComposerOpen(true)}
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  cursor: 'pointer',
                  marginBottom: 25, 
                  border: '1px solid rgba(48, 54, 61, 0.6)', 
                  transition: 'all 0.2s ease-in-out',
                  padding: '12px 16px',
                  background: '#161b22',
                  borderRadius: '12px'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = '#8b949e';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.6)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                 {/* Awatar */}
                 <div className="user-avatar small" style={{
                    width: 46, height: 46, fontSize: '0.9rem',
                    flexShrink: 0, 
                    background: '#21262d',
                    color: '#e6edf3',
                    border: '1px solid #30363d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
                 }}>
                    {me.username[0].toUpperCase()}
                 </div>

                 {/* Input - ZMIENIONO TEKST */}
                 <div style={{
                    flex: 1, 
                    color: '#8b949e', 
                    fontSize: '0.85rem',
                    background: '#0d1117', 
                    border: '1px solid #30363d',
                    borderRadius: '20px', 
                    padding: '8px 12px',
                    userSelect: 'none'
                 }}>
                    Podziel się swoimi postępami w optymalizacji...
                 </div>

                 {/* Przycisk */}
                 <button className="btn-primary" style={{
                     padding: '8px 12px',
                     borderRadius: '20px', 
                     flexShrink: 0,
                     fontWeight: 600,
                     fontSize: '0.85rem',
                     lineHeight: '1.2'
                 }}>
                    <span style={{marginRight: 4}}>+</span>Dodaj
                 </button>
              </div>
            )}

           {/* LISTA POSTÓW */}
           <section className="box"> 
              <h3 className="box-title" style={{marginBottom: 20}}>Posty</h3>

              <div style={{display:'flex', flexDirection:'column', gap:20}}>
                {visiblePosts.map(p => (
                  <div key={p._id}>
                     <PostCard post={p} currentUser={me} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
                  </div>
                ))}
                
                {filteredPosts.length === 0 && (
                  <div className="text-center" style={{padding:20}}>
                      <div style={{fontSize:'2rem', marginBottom:10}}>🧪</div>
                      <h3 className="muted">Brak wyników</h3>
                  </div>
                )}

                {/* PRZYCISK POKAŻ WIĘCEJ */}
                {visibleCount < filteredPosts.length && (
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 10)}
                    style={{
                      width: '100%', 
                      padding: '12px 0', 
                      marginTop: 15,
                      background: '#21262d',
                      border: '1px solid #30363d',
                      borderRadius: 8,
                      color: '#c9d1d9',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#30363d'}
                    onMouseOut={e => e.currentTarget.style.background = '#21262d'}
                  >
                    ⬇ Pokaż więcej ({filteredPosts.length - visibleCount})
                  </button>
                )}
              </div>
           </section>
        </div>

        <aside className="sidebar">
          <div className="box text-center">
            {me ? (
                <div>
                  <div className="user-avatar large">
                    {me.username[0].toUpperCase()}
                  </div>
                  <strong style={{display:'block', marginBottom:4, fontSize:'1.2rem', color:'#fff'}}>{me.username}</strong>
                  <div style={{color:'var(--accent)', fontSize:'0.9rem', marginBottom:20}}>{me.email}</div>
                  
                  <button className="btn-secondary btn-round" style={{width:'100%'}} onClick={() => navigate(`/profile/${me.username}`)}>
                    Mój profil
                  </button>
                </div>
            ) : (
                <div style={{padding:'10px 0'}}>
                  <h3 style={{fontSize:'1.1rem', color:'#fff'}}>Dołącz do nas</h3>
                  <p className="muted" style={{marginBottom:16}}>Zaloguj się, aby śledzić, komentować i dzielić się wiedzą.</p>
                </div>
            )}
          </div>

          <div className="box">
            <h3 className="box-title">Popularne Tagi</h3>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {trendingTags.length > 0 ? trendingTags.map(t => (
                <button 
                  key={t.tag} 
                  className={`chip ${search === t.tag ? 'active' : ''}`}
                  onClick={()=>setSearch(t.tag)}
                >
                  #{t.tag} <span style={{opacity:0.6, marginLeft:4}}>({t.count})</span>
                </button>
              )) : <span className="muted">Brak danych</span>}
            </div>
          </div>
        </aside>

        {/* Modal Composera */}
        {composerOpen && (
             <div className="modal-backdrop" onClick={()=>setComposerOpen(false)}>
               <div className="modal" onClick={e=>e.stopPropagation()}>
                  <h3 style={{marginBottom:20, marginTop:0}}>Nowy biohack</h3>
                  <textarea 
                    value={postContent} onChange={e=>setPostContent(e.target.value)} 
                    placeholder="Opisz swoje odkrycie..." autoFocus 
                    style={{minHeight:140, marginBottom:16}}
                  />
                  <div className="field">
                    <span>Tagi</span>
                    <input value={postTags} onChange={e=>setPostTags(e.target.value)} placeholder="np. sleep, diet, nootropics" />
                  </div>
                  
                  <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:16}}>
                      {BASIC_TAGS.map(t => {
                          const isActive = activeComposerTags.includes(t);
                          return (
                            <button 
                                key={t} 
                                type="button" 
                                className="chip" 
                                onClick={() => toggleComposerTag(t)}
                                style={isActive ? {
                                    background: 'rgba(0, 230, 118, 0.15)', 
                                    borderColor: '#00e676', 
                                    color: '#00e676'
                                } : {}}
                            >
                                {isActive ? `✓ ${t}` : `+ ${t}`}
                            </button>
                          );
                      })}
                  </div>
                  
                  <div className="field">
                     <span>Zdjęcie</span>
                     <input type="file" onChange={e => {
                        const f = e.target.files[0];
                        setPostImageFile(f);
                        if(f) setPostImagePreview(URL.createObjectURL(f));
                     }} />
                  </div>
                  {postImagePreview && <img src={postImagePreview} style={{marginTop:10, maxHeight:200}} alt="" />}
                  
                  <div style={{marginTop:24, display:'flex', justifyContent:'flex-end', gap:12}}>
                    <button className="btn-secondary" onClick={()=>setComposerOpen(false)}>Anuluj</button>
                    <button className="btn-primary" onClick={createPost} disabled={busy}>Opublikuj</button>
                  </div>
               </div>
             </div>
        )}

      </div>
    </div>
  );
}