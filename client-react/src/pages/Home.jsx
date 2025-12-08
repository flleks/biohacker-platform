// client-react/src/pages/Home.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getBaseUrl, getToken } from '../api';
import PostCard from '../components/PostCard'; // Używamy nowego komponentu!

export default function Home({ me }) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  
  // Composer state
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);

  const BASIC_TAGS = ['sleep','supplements','fitness','nootropics','diet'];

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    try {
      const out = await api('/api/posts');
      setPosts(out.posts || []);
    } catch (e) { console.error(e); }
  }

  // Funkcja przekazywana do PostCard, żeby odświeżyć listę po edycji/lajku
  const handlePostUpdate = () => loadPosts();

  // Funkcja przekazywana do PostCard do usunięcia z listy lokalnie
  const handlePostDelete = (id) => {
    setPosts(prev => prev.filter(p => p._id !== id));
  };

  async function createPost() {
    setBusy(true);
    try {
      const tags = postTags.split(',').map(t => t.trim()).filter(Boolean);
      const fd = new FormData();
      fd.append('content', postContent);
      fd.append('tags', JSON.stringify(tags));
      if (postImageFile) fd.append('image', postImageFile);

      const token = getToken();
      const res = await fetch(`${getBaseUrl()}/api/posts`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      });
      if (!res.ok) throw new Error('Błąd uploadu');
      
      // Reset form
      setPostContent(''); setPostTags(''); 
      if(postImagePreview) URL.revokeObjectURL(postImagePreview);
      setPostImageFile(null); setPostImagePreview(null);
      setComposerOpen(false);
      
      await loadPosts();
    } catch (e) { alert(e.message); } 
    finally { setBusy(false); }
  }

  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.trim().toLowerCase();
    return posts.filter(p => (p.content||'').toLowerCase().includes(q) || (p.tags||[]).join(' ').toLowerCase().includes(q));
  }, [posts, search]);

  const trendingTags = useMemo(() => {
    const count = {};
    posts.forEach(p => (p.tags||[]).forEach(t => count[t] = (count[t]||0)+1));
    return Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,8);
  }, [posts]);

  return (
    <div className="container">
      <div className="layout">
        <div>
           {/* Szukajka */}
           <section>
             <h2>Szukaj</h2>
             <div className="row">
               <input className="field" value={search} onChange={e=>setSearch(e.target.value)} placeholder="fraza lub #tag" style={{padding:8, flex:1}} />
               <button className="secondary" onClick={() => setSearch('')}>X</button>
             </div>
           </section>

           {/* Dodawanie posta */}
           <section>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                <h2>Posty</h2>
                {me && <button onClick={()=>setComposerOpen(true)}>+ Dodaj post</button>}
             </div>
             
             {/* Modal Composera (z przywróconymi chipami tagów) */}
             {composerOpen && (
               <div className="modal-backdrop" onClick={()=>setComposerOpen(false)}>
                 <div className="modal" onClick={e=>e.stopPropagation()}>
                    <h3>Nowy post</h3>
                    <textarea className="long-input" value={postContent} onChange={e=>setPostContent(e.target.value)} placeholder="Podziel się biohackiem..." autoFocus />
                    
                    <label style={{marginTop:8, display:'block'}}>Tagi:</label>
                    <input className="field" value={postTags} onChange={e=>setPostTags(e.target.value)} placeholder="sleep, diet..." />
                    <div style={{marginTop:5, display:'flex', gap:5, flexWrap:'wrap'}}>
                        {BASIC_TAGS.map(t => (
                            <button key={t} type="button" className="button-chip secondary" onClick={() => {
                                const cur = postTags ? postTags.split(',').map(x=>x.trim()).filter(Boolean) : [];
                                if(!cur.includes(t)) setPostTags([...cur, t].join(', '));
                            }} style={{fontSize:'0.8em', padding:'2px 6px'}}>+ {t}</button>
                        ))}
                    </div>

                    <input type="file" style={{marginTop:15}} onChange={e => {
                        const f = e.target.files[0];
                        setPostImageFile(f);
                        if(f) setPostImagePreview(URL.createObjectURL(f));
                    }} />
                    
                    {postImagePreview && <img src={postImagePreview} alt="preview" style={{maxHeight:100, marginTop:10, display:'block'}} />}

                    <div className="actions" style={{marginTop:15}}>
                      <button className="secondary" onClick={()=>setComposerOpen(false)}>Anuluj</button>
                      <button onClick={createPost} disabled={busy}>Opublikuj</button>
                    </div>
                 </div>
               </div>
             )}

             <ul className="list">
               {filteredPosts.map(p => (
                 <PostCard 
                    key={p._id} 
                    post={p} 
                    currentUser={me} 
                    onUpdate={handlePostUpdate} 
                    onDelete={handlePostDelete} 
                 />
               ))}
               {filteredPosts.length === 0 && <div className="muted">Brak postów.</div>}
             </ul>
           </section>
        </div>

        {/* Sidebar - PRZYWRÓCONY BOX PROFILU */}
        <aside className="sidebar">
          <div className="box">
            <h3>Trendy</h3>
            <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
              {trendingTags.map(([tag, c]) => (
                <span key={tag} className="button-chip secondary" onClick={()=>setSearch(tag)} style={{cursor:'pointer', padding:'2px 6px', background:'#eee', borderRadius:4}}>#{tag} ({c})</span>
              ))}
            </div>
          </div>

          <div className="box" style={{ marginTop: 15 }}>
            <h3>Mój profil</h3>
            {me ? (
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10, cursor:'pointer'}} onClick={() => navigate(`/profile/${me.username}`)}>
                    <div className="avatar" style={{width:40,height:40,background:'#ddd',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>{me.username[0].toUpperCase()}</div>
                    <strong>{me.username}</strong>
                  </div>
                  <div className="muted" style={{fontSize:'0.9em', marginBottom:10}}>{me.email}</div>
                  <button className="secondary" style={{width:'100%'}} onClick={() => navigate(`/profile/${me.username}`)}>Przejdź do profilu</button>
                </div>
            ) : (
                <div className="muted">Zaloguj się, aby zobaczyć swój profil tutaj.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}