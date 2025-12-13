// client-react/src/components/EditPost.jsx
import React, { useEffect, useMemo, useState } from 'react';

export default function EditPost({
  post, // POTRZEBNE: Przekazujemy cały obiekt posta, by sprawdzić czy to eksperyment
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

  // --- LOGIKA EKSPERYMENTU ---
  const isExperiment = post?.type === 'experiment';
  const [expTitle, setExpTitle] = useState(post?.experimentDetails?.title || '');
  const [expGoal, setExpGoal] = useState(post?.experimentDetails?.goal || '');
  const [expDuration, setExpDuration] = useState(post?.experimentDetails?.duration || '');
  const [expStatus, setExpStatus] = useState(post?.experimentDetails?.status || 'active');

  useEffect(() => setContent(initialContent ?? ''), [initialContent]);
  useEffect(() => setTags(initialTags ?? ''), [initialTags]);
  
  useEffect(() => {
    if (!imageFile) setPreview(initialImage ?? null);
  }, [initialImage, imageFile]);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(preview); } catch (e) {}
      }
    };
  }, []);

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
      
      // Pakujemy dane eksperymentu (tylko jeśli to eksperyment)
      let experimentPayload = null;
      if (isExperiment) {
        experimentPayload = {
          title: expTitle,
          goal: expGoal,
          duration: expDuration,
          status: expStatus
        };
      }

      // Przekazujemy 4 argumenty do onSave w PostCard
      await onSave(content, cleaned, imageFile, experimentPayload);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <h3 style={{marginBottom: 20, marginTop: 0, color: 'var(--text-main)'}}>
        {isExperiment ? 'Edycja Eksperymentu' : 'Edycja Posta'}
      </h3>
      
      {/* --- CZYTELNA SEKCJA EDYCJI EKSPERYMENTU --- */}
      {isExperiment && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.08)', // Delikatna zieleń
          border: '1px solid var(--accent)', 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 20
        }}>
          <h4 style={{
            margin: '0 0 16px 0', 
            color: 'var(--accent)', 
            fontSize: '0.85rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            paddingBottom: 8
          }}>
            🧪 Parametry Badania
          </h4>

          {/* 1. STATUS */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
              Status eksperymentu
            </label>
            <select
              value={expStatus}
              onChange={e => setExpStatus(e.target.value)}
              disabled={busy || submitting}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <option value="active">🟢 W trakcie (Active)</option>
              <option value="completed">🏁 Zakończony (Completed)</option>
              <option value="planned">📅 Planowany (Planned)</option>
              <option value="failed">❌ Przerwany (Failed)</option>
            </select>
          </div>

          {/* 2. TYTUŁ I CZAS (W jednym rzędzie na desktopie) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
             <div>
               <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
                 Protokół (Co badasz?)
               </label>
               <input 
                 value={expTitle} 
                 onChange={e => setExpTitle(e.target.value)}
                 disabled={busy || submitting}
                 placeholder="np. Zimne prysznice"
                 style={{ width: '100%' }}
               />
             </div>
             <div>
               <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
                 Czas trwania
               </label>
               <input 
                 value={expDuration} 
                 onChange={e => setExpDuration(e.target.value)}
                 disabled={busy || submitting}
                 placeholder="np. 30 dni"
                 style={{ width: '100%' }}
               />
             </div>
          </div>

          {/* 3. CEL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
              Cel (Hipoteza)
            </label>
            <input 
              value={expGoal} 
              onChange={e => setExpGoal(e.target.value)}
              disabled={busy || submitting}
              placeholder="np. Zwiększenie odporności, lepszy sen"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* --- STANDARDOWA EDYCJA TREŚCI --- */}
      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: 'var(--text-muted)' }}>
        Notatka / Opis postępów
      </label>
      <textarea 
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Opisz swoje odkrycie..." 
        disabled={busy || submitting}
        style={{minHeight: 140, marginBottom: 16, width: '100%', display: 'block'}}
      />

      <div className="field">
        <span>Tagi</span>
        <input 
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="np. sleep, diet, nootropics"
          disabled={busy || submitting}
        />
      </div>

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
                  background: 'var(--accent-glow)', 
                  borderColor: 'var(--accent)', 
                  color: 'var(--accent)'
                } : {}}
              >
                {isActive ? `✓ ${t}` : `+ ${t}`}
              </button>
            );
          })}
        </div>
      )}

      <div className="field">
        <span>Zdjęcie</span>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange} 
          disabled={busy || submitting} 
        />
      </div>

      {preview && (
        <div style={{marginTop: 10}}>
          <img src={preview} alt="Podgląd" style={{maxHeight: 200, borderRadius: 8}} />
          <div className="muted" style={{fontSize: '0.8rem', marginTop: 5}}>
            {imageFile ? 'Wybrano nowe zdjęcie.' : 'Obecne zdjęcie.'}
          </div>
        </div>
      )}

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