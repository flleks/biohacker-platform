// client-react/src/components/EditPost.jsx
import React, { useEffect, useMemo, useState } from 'react';

export default function EditPost({
  initialContent = '',
  initialTags = '',
  initialImage = null,
  basicTags = [],
  busy = false,
  onSave,   
  onCancel  
}) {
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState(initialTags);
  const [imageFile, setImageFile] = useState(null);       
  const [preview, setPreview] = useState(initialImage);
  const [submitting, setSubmitting] = useState(false);

  // Synchronizacja, gdy rodzic zmieni propsy
  useEffect(() => setContent(initialContent ?? ''), [initialContent]);
  useEffect(() => setTags(initialTags ?? ''), [initialTags]);
  
  // Reset podglądu gdy zmienia się initialImage z zewnątrz
  useEffect(() => {
    if (!imageFile) setPreview(initialImage ?? null);
  }, [initialImage, imageFile]);

  // Cleanup blob URL przy odmontowaniu
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(preview); } catch (e) {}
      }
    };
  }, []);

  // Parsowanie tagów (usuwanie duplikatów)
  const parsedTags = useMemo(() => {
    const arr = (tags || '').split(',').map(t => t.trim()).filter(Boolean);
    return Array.from(new Set(arr));
  }, [tags]);

  function togglePreset(t) {
    const cur = new Set(parsedTags);
    if (cur.has(t)) cur.delete(t);
    else cur.add(t);
    setTags(Array.from(cur).join(', '));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0] ?? null;
    
    if (preview && preview.startsWith('blob:')) {
      try { URL.revokeObjectURL(preview); } catch (e) {}
    }

    if (!file) {
      setImageFile(null);
      setPreview(initialImage ?? null);
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function handleSave() {
    if (busy || submitting) return;
    setSubmitting(true);
    try {
      const cleaned = parsedTags.map(t => t.trim()).filter(Boolean);
      await onSave(content, cleaned, imageFile);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // USUNIĘTO marginTop: 15, aby nie było paska nad oknem
    <div style={{ padding: 25, background: '#1c2128', borderRadius: 8, border: '1px solid #30363d' }}>
      <h3 style={{marginBottom: 20, marginTop: 0}}>Edycja posta</h3>
      
      {/* Treść */}
      <textarea 
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Opisz swoje odkrycie..." 
        disabled={busy || submitting}
        style={{minHeight: 140, marginBottom: 16, width: '100%', display: 'block'}}
      />

      {/* Tagi - Input */}
      <div className="field">
        <span>Tagi</span>
        <input 
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="np. sleep, diet, nootropics"
          disabled={busy || submitting}
        />
      </div>

      {/* Tagi - Chips (z funkcją odznaczania) */}
      {basicTags && basicTags.length > 0 && (
        <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16}}>
          {basicTags.map(t => {
            const isActive = parsedTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                className="chip"
                onClick={() => togglePreset(t)}
                disabled={busy || submitting}
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
      )}

      {/* Zdjęcie */}
      <div className="field">
        <span>Zdjęcie</span>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange} 
          disabled={busy || submitting} 
        />
      </div>

      {/* Podgląd zdjęcia */}
      {preview && (
        <div style={{marginTop: 10}}>
          <img src={preview} alt="Podgląd" style={{maxHeight: 200, borderRadius: 8}} />
          <div className="muted" style={{fontSize: '0.8rem', marginTop: 5}}>
            {imageFile ? 'Wybrano nowe zdjęcie.' : 'Obecne zdjęcie.'}
          </div>
        </div>
      )}

      {/* Przyciski Akcji */}
      <div style={{marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12}}>
        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            if (preview && preview.startsWith('blob:')) {
              try { URL.revokeObjectURL(preview); } catch (e) {}
            }
            onCancel && onCancel();
          }}
          disabled={busy || submitting}
        >
          Anuluj
        </button>

        <button
          className="btn-primary"
          type="button"
          onClick={handleSave}
          disabled={busy || submitting}
        >
          {busy || submitting ? 'Zapisuję...' : 'Zapisz zmiany'}
        </button>
      </div>
    </div>
  );
}