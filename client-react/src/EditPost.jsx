// client-react/src/EditPost.jsx
import React, { useEffect, useMemo, useState } from 'react'

export default function EditPost({
  initialContent = '',
  initialTags = '',
  initialImage = null, // URL istniejącego obrazka (może być względny lub absolutny)
  basicTags = [],
  busy = false,
  onSave,   // async (content, tagsArray, imageFile) => Promise
  onCancel  // () => void
}) {
  const [content, setContent] = useState(initialContent)
  const [tags, setTags] = useState(initialTags)
  const [imageFile, setImageFile] = useState(null)       // wybrany nowy plik
  const [preview, setPreview] = useState(initialImage)  // URL do podglądu (może być initialImage lub objectURL)
  const [submitting, setSubmitting] = useState(false)

  // Sync when parent changes initial props (useful when component is reused)
  useEffect(() => setContent(initialContent ?? ''), [initialContent])
  useEffect(() => setTags(initialTags ?? ''), [initialTags])
  useEffect(() => {
    // jeżeli rodzic przekazał inny URL obrazka, ustaw go jako podgląd (tylko jeśli nie ma lokalnego pliku)
    if (!imageFile) setPreview(initialImage ?? null)
  }, [initialImage, imageFile])

  // Cleanup object URL on unmount or when preview changes from objectURL -> something else
  useEffect(() => {
    return () => {
      // revoke only if preview was created via createObjectURL and we still have it as preview
      if (preview && preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(preview) } catch (e) {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on unmount

  // helper: parsed + deduped tags array
  const parsedTags = useMemo(() => {
    const arr = (tags || '').split(',').map(t => t.trim()).filter(Boolean)
    const seen = new Set()
    const out = []
    for (const t of arr) {
      if (!seen.has(t)) { seen.add(t); out.push(t) }
    }
    return out
  }, [tags])

  function togglePreset(t) {
    const cur = new Set(parsedTags)
    if (cur.has(t)) cur.delete(t)
    else cur.add(t)
    setTags(Array.from(cur).join(','))
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0] ?? null
    // revoke previous object URL if we created one
    if (preview && preview.startsWith('blob:')) {
      try { URL.revokeObjectURL(preview) } catch (e) {}
    }

    if (!file) {
      // user cleared selection
      setImageFile(null)
      setPreview(initialImage ?? null) // fallback to original image if present
      return
    }

    setImageFile(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  async function handleSave() {
    // don't double submit
    if (busy || submitting) return
    setSubmitting(true)
    try {
      const cleaned = parsedTags.map(t => t.trim()).filter(Boolean)
      // Pass imageFile — if user didn't choose a new file, imageFile is null and parent can keep existing image
      await onSave(content, cleaned, imageFile)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="edit-post" style={{marginTop:8, padding:8, border:'1px solid rgba(0,0,0,0.06)', borderRadius:6}}>
      <label className="field">
        <span>Edytuj treść</span>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
        />
      </label>

      <label className="field" style={{marginTop:8}}>
        <span>Tagi (oddziel przecinkami)</span>
        <input
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="sleep, supplements"
        />
      </label>

      {basicTags && basicTags.length > 0 && (
        <div style={{marginTop:6, display:'flex', gap:8, flexWrap:'wrap'}}>
          {basicTags.map(t => (
            <button
              key={t}
              type="button"
              className="secondary"
              onClick={() => togglePreset(t)}
              style={{padding:'4px 8px'}}
            >
              {parsedTags.includes(t) ? `✓ ${t}` : t}
            </button>
          ))}
        </div>
      )}

      <label className="field" style={{marginTop:8}}>
        <span>Obrazek</span>
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </label>

      {preview ? (
        <div style={{marginTop:8}}>
          <img src={preview} alt="Podgląd" style={{maxWidth:'100%', borderRadius:8}} />
          <div style={{marginTop:6, fontSize:12, color:'#666'}}>
            {imageFile ? 'Nowy plik wybrany — zostanie przesłany po zapisie.' : 'Aktualny obrazek.'}
          </div>
        </div>
      ) : (
        <div className="muted" style={{marginTop:8}}>Brak obrazka</div>
      )}

      <div className="actions" style={{marginTop:10, display:'flex', gap:8}}>
        <button
          className="secondary"
          type="button"
          onClick={() => {
            // cleanup any created objectURL when cancelling
            if (preview && preview.startsWith('blob:')) {
              try { URL.revokeObjectURL(preview) } catch (e) {}
            }
            onCancel && onCancel()
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
          {busy || submitting ? 'Zapisuję…' : 'Zapisz zmiany'}
        </button>
      </div>
    </div>
  )
}