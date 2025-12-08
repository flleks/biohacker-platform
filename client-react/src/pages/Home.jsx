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
  
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);

  const BASIC_TAGS = ['sleep','supplements','fitness','nootropics','diet'];

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    try { const out = await api('/api/posts'); setPosts(out.posts || []); } catch (e) { console.error(e); }
  }

  const handlePostUpdate = () => loadPosts();
  const handlePostDelete = (id) => setPosts(prev => prev.filter(p => p._id !== id));

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

  // --- FILTROWANIE ---
  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(p => {
      const contentMatch = (p.content || '').toLowerCase().includes(q);
      const tagsMatch = (p.tags || []).some(t => t.toLowerCase().includes(q));
      return contentMatch || tagsMatch;
    });
  }, [posts, search]);

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
        
        {/* 1. LEWA PUSTA (Centrowanie) */}
        <div className="layout-spacer-left" style={{display:'block'}}></div>

        {/* 2. FEED */}
        <div className="main-column">
           {/* BOX WYSZUKIWARKI - Teraz input ma swoje tło */}
           <section className="box" style={{padding: '20px', display:'flex', alignItems:'center', gap:15, borderRadius: 20}}>
             <div style={{fontSize:'1.2rem', opacity: 0.7}}>🔍</div>
             <div style={{flex:1}}>
                <input 
                  className="search-input-styled" // Ta klasa nadaje tło
                  value={search} 
                  onChange={e=>setSearch(e.target.value)} 
                  placeholder="Szukaj wpisów lub #tagów..." 
                />
             </div>
             {search && <button className="secondary" onClick={()=>setSearch('')} style={{padding:'8px 14px', borderRadius:20, fontSize:'0.8rem'}}>✕</button>}
           </section>

           <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, padding:'0 10px'}}>
              <h2 style={{margin:0, fontSize:'1.5rem'}}>Feed</h2>
              {me && <button onClick={()=>setComposerOpen(true)} style={{boxShadow:'0 4px 14px rgba(0,230,118,0.3)'}}>+ Nowy wpis</button>}
           </div>

           {/* Modal Composera */}
           {composerOpen && (
             <div className="modal-backdrop" onClick={()=>setComposerOpen(false)}>
               <div className="modal" onClick={e=>e.stopPropagation()}>
                  <h3 style={{marginBottom:20}}>Nowy biohack</h3>
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
                      {BASIC_TAGS.map(t => (
                          <button key={t} type="button" className="button-chip" onClick={() => {
                              const cur = postTags ? postTags.split(',').map(x=>x.trim()).filter(Boolean) : [];
                              if(!cur.includes(t)) setPostTags([...cur, t].join(', '));
                          }} style={{fontSize:'0.75rem'}}>+ {t}</button>
                      ))}
                  </div>
                  <div className="field">
                     <span>Zdjęcie</span>
                     <input type="file" onChange={e => {
                        const f = e.target.files[0];
                        setPostImageFile(f);
                        if(f) setPostImagePreview(URL.createObjectURL(f));
                     }} />
                  </div>
                  {postImagePreview && <img src={postImagePreview} style={{marginTop:10, maxHeight:200, borderRadius:8}} alt="" />}
                  <div style={{marginTop:24, display:'flex', justifyContent:'flex-end', gap:12}}>
                    <button className="secondary" onClick={()=>setComposerOpen(false)}>Anuluj</button>
                    <button onClick={createPost} disabled={busy}>Opublikuj</button>
                  </div>
               </div>
             </div>
           )}

           {/* Lista Postów */}
           <div style={{display:'flex', flexDirection:'column', gap:24}}>
             {filteredPosts.map(p => (
               <PostCard key={p._id} post={p} currentUser={me} onUpdate={handlePostUpdate} onDelete={handlePostDelete} />
             ))}
             {filteredPosts.length === 0 && (
               <div style={{textAlign:'center', color:'#8b949e', marginTop:40, padding:40, background:'rgba(255,255,255,0.02)', borderRadius:16}}>
                  <div style={{fontSize:'3rem', marginBottom:10}}>🧪</div>
                  <h3>Brak wyników</h3>
               </div>
             )}
           </div>
        </div>

        {/* 3. SIDEBAR */}
        <aside className="sidebar">
          <div className="box" style={{textAlign:'center'}}>
            {me ? (
                <div>
                  <div className="user-avatar" style={{width:80, height:80, margin:'0 auto 16px', fontSize:'2rem', boxShadow:'0 0 20px rgba(0,230,118,0.15)', border:'2px solid #30363d'}}>
                    {me.username[0].toUpperCase()}
                  </div>
                  <strong style={{display:'block', marginBottom:4, fontSize:'1.2rem', color:'#fff'}}>{me.username}</strong>
                  <div style={{color:'#00e676', fontSize:'0.9rem', marginBottom:20}}>{me.email}</div>
                  
                  <button className="secondary" style={{width:'100%', borderRadius:99}} onClick={() => navigate(`/profile/${me.username}`)}>
                    Mój profil
                  </button>
                </div>
            ) : (
                <div style={{padding:'10px 0'}}>
                  <h3 style={{fontSize:'1.1rem', color:'#fff'}}>Dołącz do nas</h3>
                  <div className="muted" style={{marginBottom:16}}>Zaloguj się, aby śledzić, komentować i dzielić się wiedzą.</div>
                </div>
            )}
          </div>

          <div className="box">
            <h3 style={{fontSize:'1rem', borderBottom:'1px solid #30363d', paddingBottom:10, marginBottom:15, textTransform:'uppercase', letterSpacing:1, color:'#8b949e'}}>Popularne Tagi</h3>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {trendingTags.length > 0 ? trendingTags.map(t => (
                <button 
                  key={t.tag} 
                  className="button-chip" 
                  onClick={()=>setSearch(t.tag)}
                  style={{background: search === t.tag ? 'rgba(0,230,118,0.2)' : ''}}
                >
                  #{t.tag} <span style={{opacity:0.6, marginLeft:4}}>({t.count})</span>
                </button>
              )) : <span className="muted">Brak danych</span>}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}