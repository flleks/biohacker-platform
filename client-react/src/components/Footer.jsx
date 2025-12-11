import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      marginTop: 'auto', // Wypycha stopkę na sam dół
      padding: '2rem 1rem',
      backgroundColor: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      textAlign: 'center',
      color: 'var(--text-secondary)',
      fontSize: '0.9rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Sekcja Disclaimera - Bardzo ważna dla biohackingu */}
        <div style={{ padding: '10px', background: 'var(--bg-app)', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
          <strong>⚠️ Nota prawna:</strong> Treści publikowane na platformie Biohacker mają charakter wyłącznie edukacyjny i hobbystyczny. 
          Nie stanowią porady medycznej. Przed zmianą diety lub suplementacji skonsultuj się z lekarzem.
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <span>© 2025 Biohacker Platform</span>
          <span>•</span>
          <span>Projekt Inżynierski</span>
          <span>•</span>
          <a href="https://github.com/twoj-nick/biohacker-platform" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            GitHub Repository
          </a>
        </div>

      </div>
    </footer>
  );
}