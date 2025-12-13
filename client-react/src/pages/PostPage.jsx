import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import PostCard from '../components/PostCard';

export default function PostPage({ me }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Przewiń na górę strony po wejściu
    window.scrollTo(0, 0);

    async function fetchPost() {
      try {
        // Używamy funkcji api() zgodnie z Twoim api.js (bez .get) i z poprawną ścieżką /api
        const res = await api(`/api/posts/${id}`);
        
        if (res && res.post) {
            setPost(res.post);
        } else {
            setError('Nie znaleziono danych posta.');
        }
      } catch (err) {
        console.error("Błąd pobierania posta:", err);
        setError('Nie udało się załadować posta.');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  const handleDelete = () => {
    navigate('/');
  };

  const handleUpdate = () => {
    // Odśwież dane po edycji
    api(`/api/posts/${id}`).then(res => setPost(res.post));
  };

  if (loading) return (
    <div className="container" style={{display: 'flex', justifyContent: 'center', marginTop: 50, color:'var(--text-main)'}}>
        <div>Ładowanie eksperymentu...</div>
    </div>
  );

  if (error || !post) return (
    <div className="container" style={{color:'var(--text-main)', textAlign:'center', marginTop: 40}}>
        <div style={{fontSize: '2rem', marginBottom: 10}}>⚠️</div>
        <h3>{error || 'Post nie istnieje.'}</h3>
        <button className="btn-secondary" onClick={() => navigate('/')} style={{marginTop: 20}}>Wróć na stronę główną</button>
    </div>
  );

  return (
    <div className="container" style={{paddingTop: 30, paddingBottom: 30}}>
      <div className="layout" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="main-column" style={{ width: '100%', maxWidth: '700px' }}>
              
              <button 
                  onClick={() => navigate(-1)} 
                  style={{
                      marginBottom: 20, 
                      background:'transparent', 
                      border:'none', 
                      color:'var(--text-muted)', 
                      display:'flex', 
                      alignItems:'center', 
                      gap: 8,
                      cursor:'pointer',
                      padding: 0,
                      fontSize: '0.95rem'
                  }}
              >
                  ← Wróć do listy
              </button>
              
              <PostCard 
                  post={post} 
                  currentUser={me} 
                  onDelete={handleDelete} 
                  onUpdate={handleUpdate}
                  isDetailView={true} // Blokuje ponowne klikanie w kartę
              />
          </div>
      </div>
    </div>
  );
}