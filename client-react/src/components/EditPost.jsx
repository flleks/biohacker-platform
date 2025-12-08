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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Parsowanie tagów (usuwanie duplikatów)
  const parsedTags = useMemo(() => {
    const arr = (tags || '').split(',').map(t => t.trim()).filter(Boolean);
    return Array.from(new Set(arr));
  }, [tags]);

  function togglePreset(t) {
    const cur = new Set(parsedTags);
    if (cur.has(t)) cur.delete(t);
    else cur.add(t);
    setTags(Array.from(cur).join(','));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0] ?? null;
    
    // Posprzątaj poprzedni blob
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
    <div className="edit-post card" style={{ marginTop: 8, padding: 15, border: '1px solid #eee' }}>
      <h4>Edycja posta</h4>
      
      <label className="field">
        <span>Treść</span>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          disabled={busy || submitting}
        />
      </label>

      <label className="field" style={{ marginTop: 8 }}>
        <span>Tagi (oddzielone przecinkami)</span>
        <input
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="np. sleep, diet"
          disabled={busy || submitting}
        />
      </label>

      {basicTags && basicTags.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {basicTags.map(t => {
            const isActive = parsedTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                className="button-chip secondary"
                onClick={() => togglePreset(t)}
                style={{ 
                  backgroundColor: isActive ? '#e5e7eb' : 'transparent',
                  border: isActive ? '1px solid #ccc' : '1px solid transparent'
                }}
              >
                {isActive ? `✓ ${t}` : t}
              </button>
            );
          })}
        </div>
      )}

      <label className="field" style={{ marginTop: 15 }}>
        <span>Zmień obrazek (opcjonalne)</span>
        <input type="file" accept="image/*" onChange={handleImageChange} disabled={busy || submitting} />
      </label>

      {preview && (
        <div style={{ marginTop: 10 }}>
          <img src={preview} alt="Podgląd" style={{ maxHeight: 200, borderRadius: 8, objectFit: 'contain' }} />
          <div className="muted" style={{ fontSize: 12 }}>
            {imageFile ? 'Nowy plik do wysłania.' : 'Obecny obrazek.'}
          </div>
        </div>
      )}

      <div className="actions" style={{ marginTop: 15, display: 'flex', gap: 10 }}>
        <button
          className="secondary"
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