// client-react/src/components/PostCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getBaseUrl } from '../api';
import EditPost from './EditPost'; // Upewnij się, że masz ten plik w components

export default function PostCard({ post, currentUser, onUpdate, onDelete }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [comments, setComments] = useState([]); // Komentarze załadowane dynamicznie
  const [newComment, setNewComment] = useState('');
  const [busy, setBusy] = useState(false);

  // --- Helpery ---
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

  const isOwner = currentUser && (currentUser._id === post.author?._id || currentUser.id === post.author?._id);

  // --- Akcje ---
  async function handleLike() {
    try {
      await api(`/api/posts/${post._id}/like`, { method: 'POST', auth: true });
      onUpdate(); // Odśwież listę w rodzicu
    } catch (e) { console.error(e); }
  }

  async function handleDelete() {
    if (!confirm('Na pewno usunąć post?')) return;
    try {
      await api(`/api/posts/${post._id}`, { method: 'DELETE', auth: true });
      onDelete(post._id);
    } catch (e) { alert(e.message); }
  }

  async function toggleComments() {
    const nextState = !commentsExpanded;
    setCommentsExpanded(nextState);
    if (nextState && comments.length === 0) {
        loadComments();
    }
  }

  async function loadComments() {
    try {
      const out = await api(`/api/posts/${post._id}/comments`);
      setComments(out.comments || []);
    } catch (e) { console.error(e); }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setBusy(true);
    try {
      await api(`/api/posts/${post._id}/comments`, { method: 'POST', body: { text: newComment }, auth: true });
      setNewComment('');
      await loadComments(); // Przeładuj komentarze
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  async function handleSaveEdit(content, tagsArray, imageFile) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      fd.append('tags', JSON.stringify(tagsArray));
      if (imageFile) fd.append('image', imageFile);

      // Token pobierze funkcja api/fetch, ale tutaj używamy fetch dla FormData
      const token = localStorage.getItem('token'); 
      const res = await fetch(`${getBaseUrl()}/api/posts/${post._id}`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      });
      
      if (!res.ok) throw new Error('Błąd edycji');
      setIsEditing(false);
      onUpdate(); // Odśwież widok
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  // --- Renderowanie ---
  
  // Tryb edycji
  if (isEditing) {
    return (
      <li className="card">
        <EditPost
          initialContent={post.content}
          initialTags={(post.tags || []).join(',')}
          initialImage={post.imageUrl ? (post.imageUrl.startsWith('http') ? post.imageUrl : `${getBaseUrl()}${post.imageUrl}`) : null}
          basicTags={['sleep','supplements','fitness','nootropics','diet']}
          busy={busy}
          onCancel={() => setIsEditing(false)}
          onSave={handleSaveEdit}
        />
      </li>
    );
  }

  // Tryb wyświetlania
  return (
    <li className="card">
      <div className="header" style={{ display: 'flex', gap: 10 }}>
        <div 
          className="avatar" 
          style={{ width: 40, height: 40, background: '#eee', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => navigate(`/profile/${post.author?.username}`)}
        >
          {(post.author?.username || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.author?.username}`)}>
                {post.author?.username}
              </strong>
              <span className="muted"> • {timeAgo(post.createdAt)}</span>
            </div>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{post.content}</div>
        </div>
      </div>

      {post.imageUrl && (
        <div style={{ marginTop: 10 }}>
          <img 
            src={post.imageUrl.startsWith('http') ? post.imageUrl : `${getBaseUrl()}${post.imageUrl}`} 
            alt="post" 
            style={{ maxWidth: '100%', borderRadius: 8 }} 
          />
        </div>
      )}

      <div className="muted" style={{ marginTop: 8 }}>
        {(post.tags || []).map(t => (
          <span key={t} style={{ marginRight: 6, color: '#2563eb', fontSize: '0.9em' }}>#{t}</span>
        ))}
      </div>

      <div className="row" style={{ marginTop: 10, gap: 10 }}>
        <button onClick={handleLike} className="secondary">
          🖤 {post.likes?.length || 0}
        </button>
        
        <button onClick={toggleComments} className="secondary">
          {commentsExpanded ? 'Schowaj kom.' : `Komentarze (${comments.length > 0 ? comments.length : ''})`}
        </button>

        {isOwner && (
          <>
            <button onClick={() => setIsEditing(true)} style={{ background: '#f59e0b', color: 'white', border: 'none' }}>Edytuj</button>
            <button onClick={handleDelete} className="danger">Usuń</button>
          </>
        )}
      </div>

      {commentsExpanded && (
        <div className="comments" style={{ marginTop: 15, borderTop: '1px solid #eee', paddingTop: 10 }}>
          {currentUser ? (
            <div className="row" style={{ marginBottom: 10 }}>
              <input 
                className="field" 
                placeholder="Dodaj komentarz..." 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
                style={{ flex: 1 }}
              />
              <button onClick={handleAddComment} disabled={busy}>Dodaj</button>
            </div>
          ) : (
            <div className="muted" style={{ marginBottom: 10 }}>Zaloguj się, aby komentować.</div>
          )}

          <ul className="list-unstyled">
            {comments.map(c => (
              <li key={c._id} style={{ marginBottom: 8, padding: 8, background: '#f9fafb', borderRadius: 4 }}>
                <div style={{ fontSize: '0.85em' }}>
                  <strong>{c.author?.username || 'Anon'}</strong> <span className="muted">• {timeAgo(c.createdAt)}</span>
                </div>
                <div>{c.text}</div>
              </li>
            ))}
            {comments.length === 0 && <div className="muted">Brak komentarzy.</div>}
          </ul>
        </div>
      )}
    </li>
  );
}