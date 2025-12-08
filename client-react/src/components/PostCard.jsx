// client-react/src/components/PostCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getBaseUrl } from '../api';
import EditPost from './EditPost'; 

export default function PostCard({ post, currentUser, onUpdate, onDelete }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [comments, setComments] = useState([]); 
  const [newComment, setNewComment] = useState('');
  const [busy, setBusy] = useState(false);

  const isLiked = post.likes && currentUser && post.likes.includes(currentUser._id);
  const isOwner = currentUser && (currentUser._id === post.author?._id);

  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'teraz';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }

  // --- Akcje ---
  async function handleLike() {
    try { await api(`/api/posts/${post._id}/like`, { method: 'POST', auth: true }); onUpdate(); } catch (e) {}
  }
  async function handleDelete() {
    if (confirm('Usunąć wpis?')) { try { await api(`/api/posts/${post._id}`, { method: 'DELETE', auth: true }); onDelete(post._id); } catch (e) {} }
  }
  async function toggleComments() {
    if (!commentsExpanded) loadComments();
    setCommentsExpanded(!commentsExpanded);
  }
  async function loadComments() {
    try { const out = await api(`/api/posts/${post._id}/comments`); setComments(out.comments || []); } catch (e) {}
  }
  async function handleAddComment() {
    if (!newComment.trim()) return;
    setBusy(true);
    try { await api(`/api/posts/${post._id}/comments`, { method: 'POST', body: { text: newComment }, auth: true }); setNewComment(''); loadComments(); } catch (e) {} finally { setBusy(false); }
  }
  async function handleSaveEdit(content, tagsArray, imageFile) {
    setBusy(true);
    try {
      const fd = new FormData(); fd.append('content', content); fd.append('tags', JSON.stringify(tagsArray)); if(imageFile) fd.append('image', imageFile);
      const token = localStorage.getItem('token');
      const res = await fetch(`${getBaseUrl()}/api/posts/${post._id}`, { method: 'PUT', headers: token ? {Authorization:`Bearer ${token}`} : {}, body: fd });
      if(!res.ok) throw new Error(); setIsEditing(false); onUpdate();
    } catch(e) { alert('Błąd'); } finally { setBusy(false); }
  }

  if (isEditing) return <div className="card" style={{border:'1px solid #f59e0b'}}><EditPost initialContent={post.content} initialTags={(post.tags||[]).join(',')} initialImage={post.imageUrl ? (post.imageUrl.startsWith('http')?post.imageUrl:`${getBaseUrl()}${post.imageUrl}`) : null} onCancel={()=>setIsEditing(false)} onSave={handleSaveEdit} busy={busy}/></div>;

  return (
    <div className="card">
      <div className="post-header">
        <div 
          className="user-avatar" 
          onClick={() => navigate(`/profile/${post.author?.username}`)}
          style={{cursor:'pointer'}}
        >
          {(post.author?.username || '?')[0].toUpperCase()}
        </div>
        
        <div className="user-info">
          <div style={{display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center'}}>
            <div>
              <strong 
                onClick={() => navigate(`/profile/${post.author?.username}`)}
                style={{cursor:'pointer', color:'#fff', marginRight: 8, fontSize:'1.05rem'}}
              >
                {post.author?.username}
              </strong>
              <span className="muted">{timeAgo(post.createdAt)}</span>
            </div>
            
            {isOwner && (
              <button onClick={handleDelete} className="danger" style={{padding:'4px 8px', fontSize:'0.75rem', height:'auto'}}>Usuń</button>
            )}
          </div>
        </div>
      </div>

      <div style={{color:'#e6edf3', fontSize:'1rem', whiteSpace:'pre-wrap', lineHeight:'1.6', marginBottom:12}}>
        {post.content}
      </div>

      {post.imageUrl && (
        <img 
          src={post.imageUrl.startsWith('http') ? post.imageUrl : `${getBaseUrl()}${post.imageUrl}`} 
          alt="post" 
          style={{width:'100%', borderRadius:8, marginBottom:12, border:'1px solid #30363d'}}
        />
      )}

      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom: 12 }}>
        {(post.tags || []).map(t => (
          <span key={t} style={{ fontSize: '0.85rem', color: '#00e676' }}>#{t}</span>
        ))}
      </div>

      <div style={{ paddingTop: 12, borderTop:'1px solid var(--border)', display:'flex', gap: 20 }}>
        <button onClick={handleLike} style={{background:'transparent', padding:0, color: isLiked?'#ef4444':'#8b949e'}}>
          {isLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
        </button>
        <button onClick={toggleComments} style={{background:'transparent', padding:0, color:'#8b949e'}}>
          💬 {commentsExpanded ? 'Ukryj' : 'Komentarze'}
        </button>
        {isOwner && <button onClick={()=>setIsEditing(true)} style={{background:'transparent', padding:0, color:'#f59e0b', marginLeft:'auto'}}>Edytuj</button>}
      </div>

      {commentsExpanded && (
        <div style={{marginTop:15, padding:15, background:'#0d1117', borderRadius:8}}>
          {currentUser && (
            <div style={{display:'flex', gap:10, marginBottom:15}}>
              <input value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Komentarz..." onKeyDown={e=>e.key==='Enter'&&handleAddComment()} />
              <button onClick={handleAddComment} disabled={busy}>Dodaj</button>
            </div>
          )}
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {comments.map(c => (
              <div key={c._id}>
                <strong style={{color:'#fff', fontSize:'0.9rem'}}>{c.author?.username}</strong>
                <span className="muted" style={{marginLeft:6, fontSize:'0.75rem'}}>{timeAgo(c.createdAt)}</span>
                <div style={{color:'#d0d7de', fontSize:'0.95rem'}}>{c.text}</div>
              </div>
            ))}
            {comments.length===0 && <div className="muted" style={{textAlign:'center'}}>Brak komentarzy.</div>}
          </div>
        </div>
      )}
    </div>
  );
}