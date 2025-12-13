import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';

export default function PostPage({ me }) {
  const { id } = useParams(); // Pobieramy ID z adresu URL
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await api.get(`/posts/${id}`);
        setPost(res.data.post);
      } catch (err) {
        setError('Nie udało się załadować posta.');
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  const handleDelete = () => {
    // Po usunięciu posta wracamy na stronę główną
    navigate('/');
  };

  const handleUpdate = () => {
    // Po edycji odświeżamy dane
    api.get(`/posts/${id}`).then(res => setPost(res.data.post));
  };

  if (loading) return (
    <div style={{minHeight: '100vh', background: 'var(--bg-app)'}}>
        <Navbar />
        <div className="container" style={{color:'var(--text-main)', textAlign:'center', marginTop: 40}}>
            Ładowanie eksperymentu...
        </div>
    </div>
  );

  if (error || !post) return (
    <div style={{minHeight: '100vh', background: 'var(--bg-app)'}}>
        <Navbar />
        <div className="container" style={{color:'var(--text-main)', textAlign:'center', marginTop: 40}}>
            {error || 'Post nie istnieje.'} <br/>
            <button className="btn-secondary" onClick={() => navigate('/')} style={{marginTop: 20}}>Wróć na główną</button>
        </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div className="container">
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
                        padding: 0
                    }}
                >
                    ← Wróć do listy
                </button>
                
                {/* Wyświetlamy kartę posta, ale w trybie pełnoekranowym można by np. wymusić rozwinięcie komentarzy */}
                <PostCard 
                    post={post} 
                    currentUser={me} 
                    onDelete={handleDelete} 
                    onUpdate={handleUpdate}
                    isDetailView={true} // Opcjonalnie: możesz dodać ten prop do PostCard, żeby np. automatycznie otworzyć komentarze
                />
            </div>
        </div>
      </div>
    </div>
  );
}