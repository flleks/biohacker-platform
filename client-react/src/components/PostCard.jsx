import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getBaseUrl } from '../api';
import EditPost from './EditPost'; 

export default function PostCard({ post, currentUser, onUpdate, onDelete, isDetailView = false }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(isDetailView); 
  const [comments, setComments] = useState([]); 
  const [newComment, setNewComment] = useState('');
  const [commentsCount, setCommentsCount] = useState(post.comments ? post.comments.length : 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCommentsCount(post.comments ? post.comments.length : 0);
  }, [post.comments]);

  useEffect(() => {
    if (isDetailView) {
      loadComments();
    }
  }, [isDetailView, post._id]);

  const isLiked = post.likes && currentUser && post.likes.includes(currentUser._id);
  const isOwner = currentUser && (currentUser._id === post.author?._id);
  const isExperiment = post.type === 'experiment';

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

  // --- NAWIGACJA ---
  const handleCardClick = (e) => {
    // Jeśli to widok szczegółowy lub zaznaczamy tekst -> nie rób nic
    if (isDetailView || window.getSelection().toString().length > 0) return;
    navigate(`/posts/${post._id}`);
  };

  const stopProp = (e) => {
    e && e.stopPropagation();
  };

  // --- AKCJE ---

  async function handleLike(e) {
    stopProp(e);
    try { await api(`/api/posts/${post._id}/like`, { method: 'POST', auth: true }); onUpdate(); } catch (e) {}
  }

  async function handleDelete(e) {
    stopProp(e);
    if (confirm('Czy usunąć ten wpis?')) { 
      try { await api(`/api/posts/${post._id}`, { method: 'DELETE', auth: true }); onDelete(post._id); } catch (e) {} 
    }
  }

  async function toggleComments(e) {
    stopProp(e);
    if (!commentsExpanded) loadComments();
    setCommentsExpanded(!commentsExpanded);
  }

  async function loadComments() {
    try { const out = await api(`/api/posts/${post._id}/comments`); setComments(out.comments || []); } catch (e) {}
  }

  async function handleAddComment(e) {
    if (e && e.stopPropagation) stopProp(e);
    if (!newComment.trim()) return;
    setBusy(true);
    try { 
        await api(`/api/posts/${post._id}/comments`, { method: 'POST', body: { text: newComment }, auth: true }); 
        setNewComment(''); 
        loadComments(); 
        setCommentsCount(prev => prev + 1); 
        if (onUpdate) onUpdate();
    } catch (e) {} finally { setBusy(false); }
  }
  
  async function handleSaveEdit(content, tagsArray, imageFile, experimentDetails) {
    setBusy(true);
    try {
      const fd = new FormData(); 
      fd.append('content', content); 
      fd.append('tags', JSON.stringify(tagsArray)); 
      if(imageFile) fd.append('image', imageFile);
      if (experimentDetails) fd.append('experimentDetails', JSON.stringify(experimentDetails));
      
      const token = localStorage.getItem('token');
      // Bezpośredni fetch dla FormData
      const res = await fetch(`${getBaseUrl()}/api/posts/${post._id}`, { 
        method: 'PUT', headers: token ? {Authorization:`Bearer ${token}`} : {}, body: fd 
      });
      if(!res.ok) throw new Error(); 
      setIsEditing(false); 
      onUpdate(); 
    } catch(e) { alert('Błąd podczas edycji'); } finally { setBusy(false); }
  }

  const authorAvatar = post.author?.avatarUrl 
    ? (post.author.avatarUrl.startsWith('http') ? post.author.avatarUrl : `${getBaseUrl()}${post.author.avatarUrl}`)
    : null;

  const cardClass = `card ${isExperiment ? 'bio-experiment-card' : ''}`;

  return (
    <>
      {isEditing && (
        <div className="modal-backdrop" onClick={() => setIsEditing(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{boxShadow:'none', cursor:'default'}}>
            <EditPost 
                post={post}
                initialContent={post.content} 
                initialTags={(post.tags||[]).join(',')} 
                initialImage={post.imageUrl ? (post.imageUrl.startsWith('http')?post.imageUrl:`${getBaseUrl()}${post.imageUrl}`) : null} 
                basicTags={['sleep','supplements','fitness','nootropics','diet']}
                onCancel={()=>setIsEditing(false)} 
                onSave={handleSaveEdit} 
                busy={busy}
            />
          </div>
        </div>
      )}

      {/* GŁÓWNY KONTENER - TERAZ KLIKALNY */}
      <div 
        className={cardClass} 
        onClick={handleCardClick}
        style={{ 
            cursor: isDetailView ? 'default' : 'pointer',
            transition: 'background-color 0.1s' 
        }}
      >
        <div className="post-header">
          <div 
            className="user-avatar" 
            onClick={(e) => { stopProp(e); navigate(`/profile/${post.author?.username}`); }}
            style={{
              cursor:'pointer',
              backgroundImage: authorAvatar ? `url(${authorAvatar})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: authorAvatar ? 'transparent' : 'inherit'
            }}
          >
            {!authorAvatar && (post.author?.username ? post.author.username[0].toUpperCase() : '?')}
          </div>
          
          <div className="user-info">
            <div style={{display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center'}}>
              <div>
                <strong 
                  onClick={(e) => { stopProp(e); navigate(`/profile/${post.author?.username}`); }}
                  style={{cursor:'pointer', color:'var(--text-main)', marginRight: 8, fontSize:'1.05rem'}}
                >
                  {post.author?.username}
                </strong>
                <span className="muted">{timeAgo(post.createdAt)}</span>
              </div>
              
              {/* Tylko usuwanie w nagłówku */}
              {isOwner && (
                <button onClick={handleDelete} className="btn-danger" style={{padding:'4px 8px', fontSize:'0.75rem', height:'auto'}}>Usuń</button>
              )}
            </div>
          </div>
        </div>

        {isExperiment && post.experimentDetails && (
          <div style={{marginBottom: 10}}>
             <span className="bio-badge">🧪 Eksperyment N=1</span>
             <div className="experiment-details">
                <div style={{gridColumn: '1 / -1', borderBottom:'1px solid #e5e7eb', paddingBottom:6, marginBottom:4}}>
                    <strong>Status:</strong> 
                    <span style={{marginLeft:6, fontWeight:700, 
                        color: post.experimentDetails.status === 'completed' ? '#059669' : 
                               post.experimentDetails.status === 'failed' ? '#dc2626' : 
                               post.experimentDetails.status === 'planned' ? '#2563eb' : '#059669'
                    }}>
                        {post.experimentDetails.status === 'active' && '🟢 W trakcie'}
                        {post.experimentDetails.status === 'completed' && '🏁 Zakończony'}
                        {post.experimentDetails.status === 'failed' && '❌ Przerwany'}
                        {post.experimentDetails.status === 'planned' && '📅 Planowany'}
                    </span>
                </div>
                <div><strong>Protokół</strong> {post.experimentDetails.title || '-'}</div>
                <div><strong>Cel</strong> {post.experimentDetails.goal || '-'}</div>
                <div style={{gridColumn: '1 / -1'}}><strong>Czas</strong> {post.experimentDetails.duration || '-'}</div>
             </div>
          </div>
        )}

        <div style={{color:'var(--text-main)', fontSize:'1rem', whiteSpace:'pre-wrap', lineHeight:'1.6', marginBottom:12}}>
            {post.content}
        </div>

        {post.imageUrl && (
            <img 
            src={post.imageUrl.startsWith('http') ? post.imageUrl : `${getBaseUrl()}${post.imageUrl}`} 
            alt="post" 
            style={{width:'100%', borderRadius:8, marginBottom:12, border:'1px solid var(--border)'}}
            />
        )}

        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom: 12 }}>
            {(post.tags || []).map(t => (
            <span key={t} className="chip">#{t}</span>
            ))}
        </div>

        {/* STOPKA Z PRZYCISKAMI */}
        <div style={{ paddingTop: 12, borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap: 20 }}>
          
          <button onClick={handleLike} style={{background:'transparent', padding:0, color: isLiked?'#ef4444':'var(--text-muted)'}}>
            {isLiked ? '❤️' : '🤍'} {post.likes?.length || 0}
          </button>
          
          <button onClick={toggleComments} style={{background:'transparent', padding:0, color:'var(--text-muted)'}}>
            💬 {commentsExpanded ? 'Ukryj' : 'Komentarze'} <span style={{opacity: 0.8}}>{commentsCount}</span>
          </button>

          {/* LICZNIK WYŚWIETLEŃ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'default' }}>
             👁️ <span style={{opacity: 0.8}}>{post.views || 0}</span>
          </div>

          {/* PRZYCISK EDYCJI */}
          {isOwner && (
              <button 
                  onClick={(e) => { stopProp(e); setIsEditing(true); }} 
                  style={{background:'transparent', padding:0, color:'#f59e0b', marginLeft:'auto'}}
              >
                  ✏️ Edytuj
              </button>
          )}
        </div>

        {commentsExpanded && (
          <div style={{marginTop:15, padding:15, background:'var(--bg-input)', borderRadius:8}} onClick={stopProp}>
            {currentUser && (
              <div style={{display:'flex', gap:10, marginBottom:15}}>
                <input 
                    value={newComment} 
                    onChange={e=>setNewComment(e.target.value)} 
                    placeholder="Napisz komentarz..." 
                    onKeyDown={e=>e.key==='Enter'&&handleAddComment(e)} 
                />
                <button onClick={(e) => handleAddComment(e)} disabled={busy} className="btn-secondary" style={{padding: '0 15px'}}>Dodaj</button>
              </div>
            )}
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {comments.map(c => (
                <div key={c._id}>
                  <strong style={{color:'var(--text-main)', fontSize:'0.9rem'}}>{c.author?.username}</strong>
                  <span className="muted" style={{marginLeft:6, fontSize:'0.75rem'}}>{timeAgo(c.createdAt)}</span>
                  <div style={{color:'var(--text-main)', fontSize:'0.95rem', opacity: 0.9}}>{c.text}</div>
                </div>
              ))}
              {comments.length===0 && <div className="muted" style={{textAlign:'center'}}>Brak komentarzy.</div>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}