import React, { useEffect, useMemo, useState } from 'react'
import { api, getBaseUrl, setBaseUrl, getToken, setToken } from './api'
import EditPost from './EditPost'

/**
 * ProfileEdit - niezależny komponent edycji profilu.
 * Trzyma własny lokalny stan, więc nie traci fokusu gdy rodzic się rerenderuje.
 */
function ProfileEdit({ user, onCancel, onSave, busy = false }) {
  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    bio: user?.bio ?? ''
  })

  // Reinit form only when editing a different user (id changes)
  useEffect(() => {
    setForm({
      username: user?.username ?? '',
      email: user?.email ?? '',
      bio: user?.bio ?? ''
    })
  }, [user && (user._id ?? user.id)])

  return (
    <div
      className="profile-edit"
      style={{ marginTop: 12, padding: 12, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8 }}
      onClick={(e) => e.stopPropagation()}
    >
      <h4>Edytuj profil</h4>

      <label className="field">
        <span>Username</span>
        <input
          autoFocus
          value={form.username}
          onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
        />
      </label>

      <label className="field" style={{ marginTop: 8 }}>
        <span>Email</span>
        <input
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
        />
      </label>

      <label className="field" style={{ marginTop: 8 }}>
        <span>Bio</span>
        <textarea
          rows={4}
          value={form.bio}
          onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
        />
      </label>

      <div className="actions" style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button type="button" className="secondary" onClick={onCancel} disabled={busy}>Anuluj</button>
        <button
          type="button"
          onClick={() => onSave({ username: form.username, email: form.email, bio: form.bio })}
          disabled={busy}
        >
          {busy ? 'Zapisuję…' : 'Zapisz'}
        </button>
      </div>
    </div>
  )
}

function TextInput({ label, value, onChange, onFocus, type = 'text', placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
      />
    </label>
  )
}

// default type="button" to avoid accidental form submit
function Button({ children, type = 'button', ...props }) {
  return (
    <button type={type} {...props}>{children}</button>
  )
}

function Section({ title, children, onClick }) {
  return (
    <section onClick={onClick}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export default function App() {
  const [base, setBase] = useState(getBaseUrl())
  const [health, setHealth] = useState('sprawdzam...')

  const [reg, setReg] = useState({ username: '', email: '', password: '' })
  const [log, setLog] = useState({ email: '', password: '' })
  const [me, setMe] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [postContent, setPostContent] = useState('')
  const [postTags, setPostTags] = useState('')
  const [posts, setPosts] = useState([])
  const [search, setSearch] = useState('')

  // new: file upload state for creating posts
  const [postImageFile, setPostImageFile] = useState(null)
  const [postImagePreview, setPostImagePreview] = useState(null)

  // dla edycji posta (nie wymagane do trzymania pliku - EditPost przekaże bezpośrednio)
  const [editingPostImageFile, setEditingPostImageFile] = useState(null)
  const [editingPostImagePreview, setEditingPostImagePreview] = useState(null)

  const [commentPostId, setCommentPostId] = useState('')
  const [commentContent, setCommentContent] = useState('')
  const [commentsByPost, setCommentsByPost] = useState({})
  const [expandedComments, setExpandedComments] = useState({})

  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login') // 'login' | 'register'

  // zamiast modal: inline composer (wysuwany panel)
  const [composerOpen, setComposerOpen] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)

  const BASIC_TAGS = ['sleep','supplements','fitness','nootropics','diet']

  // routing
  const [route, setRoute] = useState(() => {
    const p = window.location.pathname.split('/').filter(Boolean)
    if (p[0] === 'profile' && p[1]) return 'profile'
    return 'home'
  })
  const [routeParams, setRouteParams] = useState(() => {
    const p = window.location.pathname.split('/').filter(Boolean)
    if (p[0] === 'profile' && p[1]) return { username: p[1] }
    return {}
  })

  // profile data + local edit form state
  const [profileUser, setProfileUser] = useState(null)
  const [profilePosts, setProfilePosts] = useState([])
  const [profileEditOpen, setProfileEditOpen] = useState(false)

  const token = useMemo(() => getToken(), [me])

  function userId(u) {
    if (!u) return null
    const id = u._id ?? u.id
    return id == null ? null : String(id)
  }

  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts
    const q = search.trim().toLowerCase()
    return posts.filter(p => {
      const content = (p.content || '').toLowerCase()
      const tags = (p.tags || []).join(' ').toLowerCase()
      const author = (p.author?.username || '').toLowerCase()
      return content.includes(q) || tags.includes(q) || author.includes(q)
    })
  }, [posts, search])

  const trendingTags = useMemo(() => {
    const count = {}
    for (const p of posts) {
      for (const t of (p.tags || [])) {
        const tag = String(t).trim()
        if (!tag) continue
        count[tag] = (count[tag] || 0) + 1
      }
    }
    return Object.entries(count)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 8)
      .map(([tag, c]) => ({ tag, count: c }))
  }, [posts])

  useEffect(() => {
    checkHealth()
    loadPosts()
    loadMe()

    const onPop = () => {
      const p = window.location.pathname.split('/').filter(Boolean)
      if (p[0] === 'profile' && p[1]) {
        setRoute('profile')
        setRouteParams({ username: p[1] })
      } else {
        setRoute('home')
        setRouteParams({})
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (route === 'profile' && routeParams.username) {
      fetchProfile(routeParams.username)
    }
  }, [route, routeParams])

  function navigate(to, params = {}) {
    if (to === 'profile' && params.username) {
      const url = `/profile/${params.username}`
      window.history.pushState({}, '', url)
      setRoute('profile')
      setRouteParams({ username: params.username })
    } else {
      window.history.pushState({}, '', '/')
      setRoute('home')
      setRouteParams({})
    }
  }

  async function checkHealth() {
    try {
      const h = await api('/health')
      setHealth(h?.status ?? 'ok')
    } catch (e) {
      setHealth('error')
    }
  }

  async function saveBaseUrl() {
    setBaseUrl(base)
    await checkHealth()
  }

  async function doRegister() {
    setBusy(true); setError('')
    try {
      const out = await api('/api/auth/register', { method: 'POST', body: reg })
      setToken(out.token)
      await loadMe()
      return true
    } catch (e) {
      setError(e?.message || String(e))
      return false
    } finally { setBusy(false) }
  }

  async function doLogin() {
    setBusy(true); setError('')
    try {
      const out = await api('/api/auth/login', { method: 'POST', body: log })
      setToken(out.token)
      await loadMe()
      return true
    } catch (e) {
      setError(e?.message || String(e))
      return false
    } finally { setBusy(false) }
  }

  async function loadMe() {
    try {
      const out = await api('/api/auth/me', { auth: true })
      setMe(out.user)
    } catch {
      setMe(null)
    }
  }

  function doLogout() {
    setToken('')
    setMe(null)
    navigate('home')
  }

  async function loadPosts(authorId) {
    try {
      const url = authorId ? `/api/posts?author=${authorId}` : '/api/posts'
      const out = await api(url)
      setPosts(out.posts || [])
    } catch (e) {
      // ignore
    }
  }

  // updated: createPost always uses FormData for consistency
  async function createPost(closeComposer = false) {
    setBusy(true); setError('')
    try {
      const tags = postTags ? postTags.split(',').map(t => t.trim()).filter(Boolean) : []

      // Zawsze wysyłaj FormData (z zdjęciem lub bez)
      const fd = new FormData()
      fd.append('content', postContent)
      fd.append('tags', JSON.stringify(tags))
      if (postImageFile) {
        fd.append('image', postImageFile)
      }

      const res = await fetch(`${getBaseUrl()}/api/posts`, {
        method: 'POST',
        headers: {
          // don't set Content-Type here; browser will set the multipart boundary
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: fd
      })
      if (!res.ok) {
        const b = await res.json().catch(() => null)
        throw new Error(b?.message || res.statusText || 'Błąd uploadu')
      }

      // clear inputs + revoke preview URL
      setPostContent(''); setPostTags('')
      if (postImagePreview) { try { URL.revokeObjectURL(postImagePreview) } catch(e) {} ; setPostImagePreview(null) }
      setPostImageFile(null)

      await loadPosts()
      if (closeComposer) setComposerOpen(false)
    } catch (e) { setError(e?.message || String(e)) } finally { setBusy(false) }
  }

  async function likePost(id) {
    // Optymistyczne zachowanie: natychmiast zaktualizuj UI, potem wyślij request.
    // W razie błędu cofamy zmianę przez przeładowanie odpowiedniej listy.
    const uid = userId(me)
    // zachowaj snapshot do rollbacku
    const prevPosts = posts
    const prevProfilePosts = profilePosts

    // helper toggle dla likes, obsługuje tablicę lub liczbę (najczęstsze przypadki)
    const toggleLikesFor = (likes) => {
      if (Array.isArray(likes)) {
        // jeśli mamy id użytkownika — toggluj obecność
        if (uid) {
          const has = likes.includes(uid)
          return has ? likes.filter(x => x !== uid) : [...likes, uid]
        }
        // bez uid — nie potrafimy togglowac logicznie; dodaj placeholder
        return [...likes, null]
      }
      if (typeof likes === 'number') {
        // nie znamy poprzedniego stanu (czy użytkownik już lajkował) — przyjmij +1
        return likes + 1
      }
      // null/undefined -> nowa tablica z naszym uid albo placeholderem
      return uid ? [uid] : [null]
    }

    // apply optimistic update locally
    setPosts(prev => prev.map(post => {
      if (post._id !== id) return post
      return { ...post, likes: toggleLikesFor(post.likes || []) }
    }))
    setProfilePosts(prev => prev.map(post => {
      if (post._id !== id) return post
      return { ...post, likes: toggleLikesFor(post.likes || []) }
    }))

    try {
      const res = await api(`/api/posts/${id}/like`, { method: 'POST', auth: true })
      // jeśli backend zwraca konkretną strukturę likes, zaktualizuj zgodnie z odpowiedzią
      if (res && res.likes !== undefined) {
        setPosts(prev => prev.map(post => post._id === id ? { ...post, likes: res.likes } : post))
        setProfilePosts(prev => prev.map(post => post._id === id ? { ...post, likes: res.likes } : post))
      }
      // w przeciwnym wypadku zostawiamy optymistyczną wartość, która już została ustawiona
    } catch (e) {
      console.error('likePost failed, rolling back', e)
      // rollback: przywróć poprzednie stany
      setPosts(prevPosts)
      setProfilePosts(prevProfilePosts)
      // dodatkowo odśwież z serwera żeby mieć pewność (opcjonalne)
      try {
        if (route === 'profile' && profileUser?.username) {
          await fetchProfile(profileUser.username)
        } else {
          await loadPosts()
        }
      } catch (_) {}
      setError('Nie udało się polubić posta (spróbuj ponownie).')
    }
  }

  async function deletePost(id) {
    try {
      await api(`/api/posts/${id}`, { method: 'DELETE', auth: true })
      if (route === 'home') await loadPosts()
      else await fetchProfile(routeParams.username)
    } catch (e) {
      setError(e?.message || String(e))
    }
  }

  async function addInlineComment(postId, content) {
    if (!postId || !content || !content.trim()) return
    setBusy(true); setError('')
    try {
      await api(`/api/posts/${postId}/comments`, { method: 'POST', body: { text: content }, auth: true })
      await loadCommentsFor(postId)
      if (commentPostId === postId) setCommentContent('')
    } catch (e) {
      setError(e?.message || String(e))
    } finally { setBusy(false) }
  }

  async function loadCommentsFor(postId) {
    if (!postId) return
    try {
      const out = await api(`/api/posts/${postId}/comments`)
      setCommentsByPost(prev => ({ ...prev, [postId]: out.comments || [] }))
    } catch (e) {
      console.error('loadCommentsFor', e)
    }
  }

  // savePostEdits now accepts imageFile param and sends multipart/form-data
  async function savePostEdits(postId, content, tagsArray, imageFile = null) {
    if (!postId) return
    setBusy(true); setError('')
    try {
      const fd = new FormData()
      fd.append('content', content)
      fd.append('tags', JSON.stringify(tagsArray))
      if (imageFile) fd.append('image', imageFile)

      const res = await fetch(`${getBaseUrl()}/api/posts/${postId}`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      })

      if (!res.ok) {
        const b = await res.json().catch(() => null)
        throw new Error(b?.message || res.statusText || 'Błąd uploadu')
      }

      // close editor (will remount EditPost next open)
      setEditingPostId(null)
      // clear any local edit-image preview state in parent
      setEditingPostImageFile(null)
      if (editingPostImagePreview) {
        try { URL.revokeObjectURL(editingPostImagePreview) } catch(e) {}
        setEditingPostImagePreview(null)
      }

      // refresh data after successful save
      if (route === 'home') await loadPosts()
      else if (route === 'profile' && profileUser) await fetchProfile(profileUser.username)

    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  async function fetchProfile(username) {
    setProfileUser(null)
    setProfilePosts([])
    try {
      const out = await api(`/api/users/${username}`)
      setProfileUser(out.user)
      const authorId = out.user._id ?? out.user.id
      const postsOut = await api(`/api/posts?author=${authorId}`)
      setProfilePosts(postsOut.posts || [])
      // do NOT forcibly overwrite edit state here
    } catch (e) {
      setError(e?.message || String(e))
    }
  }

  // saveProfileUpdates now accepts newData from ProfileEdit
  async function saveProfileUpdates(newData) {
    if (!profileUser) return
    setBusy(true); setError('')
    try {
      const id = profileUser._id ?? profileUser.id
      const out = await api(`/api/users/${id}`, { method: 'PUT', body: newData, auth: true })
      setProfileUser(out.user)
      await loadMe()
      if (out.user?.username) await fetchProfile(out.user.username)
      setProfileEditOpen(false)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  function Avatar({ name, size = 40 }) {
    const initials = (name || 'U').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()
    return <div className="avatar" style={{width:size,height:size}}>{initials}</div>
  }

  function timeAgo(iso) {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff/60000); if (m < 1) return 'teraz'; if (m < 60) return `${m}m`
    const h = Math.floor(m/60); if (h < 24) return `${h}h`
    const d = Math.floor(h/24); return `${d}d`
  }

  function Navbar() {
    return (
      <div className="navbar">
        <div className="brand" style={{cursor:'pointer'}} onClick={() => navigate('home')}><span className="logo"></span> Biohacker</div>
        <div className="nav-right">
          {me ? (
            <>
              <span className="muted">Zalogowany jako</span>
              <div style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}} onClick={() => navigate('profile', { username: me.username })}>
                <Avatar name={me.username} />
                <strong>{me.username}</strong>
              </div>
            </>
          ) : (
            <>
              <span className="muted">Niezalogowany</span>
              <Button className="secondary" onClick={() => { setAuthTab('login'); setAuthOpen(true) }}>Zaloguj</Button>
              <Button onClick={() => { setAuthTab('register'); setAuthOpen(true) }}>Zarejestruj</Button>
            </>
          )}
        </div>
      </div>
    )
  }

  function Toasts() {
    return (
      <div className="toasts">
        {busy && <div className="toast"><span className="spinner" /> Przetwarzam…</div>}
        {error && <div className="toast">{error}</div>}
      </div>
    )
  }

  function ProfilePage() {
    const isOwner = profileUser && me && String(userId(me)) === String(profileUser._id ?? profileUser.id)

    return (
      <div className="container" onClick={(e) => e.stopPropagation()}>
        <div className="layout">
          <div>
            <Section title={`Profil: ${profileUser?.username || '...'}`} onClick={(e) => e.stopPropagation()}>
              {profileUser ? (
                <div>
                  <div className="row">
                    <Avatar name={profileUser.username} size={60} />
                    <div>
                      <h3>{profileUser.username}</h3>
                      <div className="muted">{profileUser.email}</div>
                      <div style={{marginTop:8}}>{profileUser.bio}</div>
                    </div>
                  </div>

                  {isOwner && (
                    <div style={{marginTop:12}}>
                      <Button onClick={() => {
                        setProfileEditOpen(prev => {
                          const opening = !prev
                          if (opening && profileUser) {
                            // open edit (ProfileEdit will initialize its own copy)
                            // no need to set local form here
                          }
                          return opening
                        })
                      }}>
                        {profileEditOpen ? 'Zamknij edycję profilu' : 'Edytuj profil'}
                      </Button>

                      {profileEditOpen && profileUser && (
                        <ProfileEdit
                          key={profileUser._id ?? profileUser.id} // remount only for different user
                          user={profileUser}
                          busy={busy}
                          onCancel={() => {
                            setProfileEditOpen(false)
                            // optionally refresh from server to discard local changes
                            if (profileUser?.username) fetchProfile(profileUser.username)
                          }}
                          onSave={async (newData) => {
                            await saveProfileUpdates(newData)
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : <div className="muted">Ładowanie profilu...</div>}
            </Section>

            <Section title="Posty użytkownika">
              <ul className="list">
                {profilePosts.length ? profilePosts.map(pp => (
                  <li key={pp._id} className="card">
                    <div className="header" style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flexShrink: 0 }}>
                        <Avatar name={pp.author?.username || 'Anon'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div>
                          <strong>{pp.author?.username}</strong>
                          <span className="muted"> • {timeAgo(pp.createdAt)}</span>
                        </div>
                        <div>{pp.content}</div>
                      </div>
                    </div>

                    {pp.imageUrl && (
                      <div style={{ marginTop: 8 }}>
                        <img
                          src={pp.imageUrl.startsWith('http') ? pp.imageUrl : `${getBaseUrl().replace(/\/$/, '')}${pp.imageUrl}`}
                          alt="post"
                          style={{ maxWidth: '100%', borderRadius: 8 }}
                        />
                      </div>
                    )}

                    <div className="muted">Tagi: {(pp.tags||[]).length ? (pp.tags||[]).map(t => (
                      <Button key={t} className="secondary" onClick={() => { setSearch(t); navigate('home') }} style={{padding:'4px 8px', marginRight:6}}>{t}</Button>
                    )) : '-'}</div>

                    <div className="row">
                      <Button onClick={() => likePost(pp._id)}>🖤 {Array.isArray(pp.likes) ? pp.likes.length : (typeof pp.likes === 'number' ? pp.likes : (pp.likes ? pp.likes.length : 0))}</Button>

                      {me && String(userId(me)) === String(pp.author?._id ?? pp.author?.id) && (
                        <> 
                          <Button onClick={() => setEditingPostId(pp._id)} style={{backgroundColor:'#fbbf24', color:'black', borderRadius:'6px', padding:'8px 16px', transition:'all 0.2s', cursor:'pointer'}} onMouseEnter={(e) => e.target.style.backgroundColor='#f59e0b'} onMouseLeave={(e) => e.target.style.backgroundColor='#fbbf24'}>Edytuj</Button>
                          <Button onClick={() => deletePost(pp._id)} className="danger">Usuń</Button>
                        </>
                      )}

                      <Button onClick={() => {
                        setCommentPostId(pp._id)
                        setExpandedComments(prev => ({ ...prev, [pp._id]: !prev[pp._id] }))
                        if (!expandedComments[pp._id]) loadCommentsFor(pp._id)
                      }} className="secondary">{expandedComments[pp._id] ? 'Schowaj komentarze' : 'Komentarze'}</Button>
                    </div>

                    {editingPostId === pp._id && (
                      <EditPost
                        key={pp._id} // remount each time to reset internal preview
                        initialContent={pp.content || ''}
                        initialTags={(pp.tags || []).join(',')}
                        initialImage={pp.imageUrl ? (pp.imageUrl.startsWith('http') ? pp.imageUrl : `${getBaseUrl().replace(/\/$/, '')}${pp.imageUrl}`) : null}
                        basicTags={BASIC_TAGS}
                        busy={busy}
                        onCancel={() => {
                          setEditingPostId(null)
                        }}
                        // IMPORTANT: EditPost will pass imageFile as 3rd arg when user selected one
                        onSave={async (content, tagsArray, imageFile) => {
                          await savePostEdits(pp._id, content, tagsArray, imageFile)
                        }}
                      />
                    )}

                    {expandedComments[pp._id] && (
                      <div className="comments">
                        <div className="row">
                          <TextInput label="Dodaj komentarz" value={commentPostId === pp._id ? commentContent : ''} onChange={(v) => { setCommentPostId(pp._id); setCommentContent(v) }} />
                          <Button disabled={busy} onClick={() => addInlineComment(pp._id, commentPostId === pp._id ? commentContent : '')}>Dodaj</Button>
                        </div>
                        <ul className="list">
                          {(commentsByPost[pp._id] || []).map(c => (
                            <li key={c._id} className="comment">
                              <Avatar name={c.author?.username || 'Anon'} />
                              <div>
                                <div><strong>{c.author?.username || 'anon'}</strong> <span className="muted">• {timeAgo(c.createdAt)}</span></div>
                                <div>{c.text}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                )) : <div className="muted">Brak postów</div>}
              </ul>
            </Section>
          </div>

          <aside className="sidebar">
            <div className="box">
              <h3>Trendujące tagi</h3>
              <div className="row" style={{gap:8, flexWrap:'wrap'}}>
                {trendingTags.length ? trendingTags.map(t => (
                  <Button key={t.tag} className="secondary" onClick={() => { setSearch(t.tag); navigate('home') }}>{`#${t.tag} (${t.count})`}</Button>
                )) : <span className="muted">Brak danych</span>}
              </div>
            </div>

            <div className="box" style={{marginTop:12}}>
              <h3>Mój profil</h3>
              {me ? (
                <div>
                  <div className="row" style={{cursor:'pointer'}} onClick={() => navigate('profile', { username: me.username })}><Avatar name={me.username} /><strong>{me.username}</strong></div>
                  <div className="muted">{me.email}</div>
                  <div className="row" style={{marginTop:8}}>
                    <Button className="secondary" onClick={loadMe}>Odśwież</Button>
                    <Button onClick={doLogout}>Wyloguj</Button>
                  </div>
                </div>
              ) : (
                <div className="muted">Zaloguj się z paska u góry, aby zobaczyć profil.</div>
              )}
            </div>
          </aside>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      {route === 'home' ? (
        <>
          <div className="container">
            <div className="layout">
              <div>
                <section>
                  <h2>Szukaj</h2>
                  <div className="row">
                    <TextInput label="" value={search} onChange={setSearch} placeholder="fraza lub #tag" />
                    <Button className="secondary" onClick={() => setSearch('')}>Wyczyść</Button>
                  </div>
                </section>

                <Section title="Posty">
                  {me ? (
                    <div style={{display:'flex', flexDirection:'column', gap:8}}>
                      {/* Dodaj post button + motivational text */}
                      <div style={{display:'flex', gap:12, alignItems:'center'}}>
                        <Button onClick={() => setComposerOpen(true)}>Dodaj post</Button>
                        <div style={{flex:1, color:'#666', fontSize:'14px', fontStyle:'italic'}}>
                          Podziel się swoim biohackiem! Jak optymalizujesz zdrowie i wydajność?
                        </div>
                      </div>

                      {/* modalny panel */}
                      {composerOpen && (
                        <div className="modal-backdrop" onClick={() => setComposerOpen(false)}>
                          <div className="modal" onClick={(e)=>e.stopPropagation()}>
                            <label className="field">
                              <span>Treść</span>
                              <textarea
                                className="long-input"
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                placeholder="Podziel się swoim biohackiem..."
                                autoFocus
                              />
                            </label>

                            <label className="field" style={{marginTop:8}}>
                              <span>Tagi (comma-separated)</span>
                              <input value={postTags} onChange={(e)=> setPostTags(e.target.value)} placeholder="sleep, diet" />
                            </label>

                            <div style={{marginTop:8, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                              {BASIC_TAGS.map(t => {
                                const cur = (postTags || '').split(',').map(x=>x.trim()).filter(Boolean)
                                const isSelected = cur.includes(t)
                                return (
                                  <Button key={t} className="button-chip secondary" onClick={() => {
                                    if (isSelected) setPostTags(cur.filter(x=>x!==t).join(','))
                                    else setPostTags([...cur, t].join(','))
                                  }} style={{backgroundColor: isSelected ? '#238636' : '', color: isSelected ? 'white' : ''}}>
                                    {isSelected ? '✓ ' : ''}{t}
                                  </Button>
                                )
                              })}
                            </div>

                            <div style={{marginTop:8}}>
                              <input type="file" accept="image/*" onChange={(e) => {
                                const f = e.target.files?.[0] ?? null
                                setPostImageFile(f)
                                if (f) {
                                  const url = URL.createObjectURL(f)
                                  if (postImagePreview) try { URL.revokeObjectURL(postImagePreview) } catch(e) {}
                                  setPostImagePreview(url)
                                } else {
                                  if (postImagePreview) { URL.revokeObjectURL(postImagePreview) }
                                  setPostImagePreview(null)
                                }
                              }} />

                              {postImagePreview && (
                                <div style={{marginTop:8, display:'flex', gap:8, alignItems:'center'}}>
                                  <div className="preview-thumb"><img src={postImagePreview} alt="preview" /></div>
                                  <div>
                                    <Button className="secondary" onClick={() => {
                                      if (postImagePreview) { try { URL.revokeObjectURL(postImagePreview) } catch(e) {} }
                                      setPostImagePreview(null); setPostImageFile(null)
                                    }}>Usuń obraz</Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="actions" style={{marginTop:8}}>
                              <Button className="secondary" onClick={() => {
                                // cancel and reset composer inline
                                setComposerOpen(false)
                                setPostContent(''); setPostTags('')
                                if (postImagePreview) { try { URL.revokeObjectURL(postImagePreview) } catch(e) {} ; setPostImagePreview(null) }
                                setPostImageFile(null)
                              }}>Anuluj</Button>
                              <Button disabled={busy} onClick={async () => { await createPost(true) }}>{busy ? 'Dodawanie…' : 'Dodaj'}</Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="muted">Zaloguj się, aby dodać post. Możesz jednak przeglądać i wyszukiwać istniejące posty.</div>
                  )}

                  <ul className="list">
                    {filteredPosts.map(p => (
                      <li key={p._id} className="card">
                        <div className="header" style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ flexShrink: 0 }}>
                              <Avatar name={p.author?.username || 'Anon'} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div>
                                <strong style={{cursor:'pointer'}} onClick={() => navigate('profile', { username: p.author?.username })}>
                                  {p.author?.username || 'anon'}
                                </strong>
                                <span className="muted"> • {timeAgo(p.createdAt)}</span>
                              </div>
                              <div>{p.content}</div>
                            </div>
                          </div>

                          {p.imageUrl && (
                            <div style={{ marginTop: 8 }}>
                              <img
                                src={p.imageUrl.startsWith('http') ? p.imageUrl : `${getBaseUrl().replace(/\/$/, '')}${p.imageUrl}`}
                                alt="post"
                                style={{ maxWidth: '100%', borderRadius: 8 }}
                              />
                            </div>
                          )}

                        <div className="muted">Tagi: {(p.tags||[]).length ? (p.tags||[]).map(t => (
                          <Button key={t} className="secondary" onClick={() => setSearch(t)} style={{padding:'4px 8px', marginRight:6}}>{t}</Button>
                        )) : '-'}</div>

                        <div className="row">
                          <Button onClick={() => likePost(p._id)}>🖤 {Array.isArray(p.likes) ? p.likes.length : (typeof p.likes === 'number' ? p.likes : (p.likes ? p.likes.length : 0))}</Button>

                          {me && String(userId(me)) === String(p.author?._id ?? p.author?.id) && (
                            <>
                              <Button 
                                onClick={() => setEditingPostId(p._id)} 
                                style={{backgroundColor:'#fbbf24', color:'black', borderRadius:'6px', padding:'8px 16px'}}
                                onMouseEnter={(e) => e.target.style.backgroundColor='#f59e0b'} 
                                onMouseLeave={(e) => e.target.style.backgroundColor='#fbbf24'}
                              >
                                Edytuj
                              </Button>
                              <Button onClick={() => deletePost(p._id)} className="danger">Usuń</Button>
                            </>
                          )}

                          <Button onClick={() => {
                            setCommentPostId(p._id)
                            setExpandedComments(prev => ({ ...prev, [p._id]: !prev[p._id] }))
                            if (!expandedComments[p._id]) loadCommentsFor(p._id)
                          }} className="secondary">{expandedComments[p._id] ? 'Schowaj komentarze' : 'Komentarze'}</Button>
                        </div>

                          {editingPostId === p._id && (
                          <EditPost
                            initialContent={p.content || ''}
                            initialTags={(p.tags || []).join(',')}
                            initialImage={p.imageUrl ? (p.imageUrl.startsWith('http') ? p.imageUrl : `${getBaseUrl().replace(/\/$/, '')}${p.imageUrl}`) : null}
                            basicTags={BASIC_TAGS}
                            busy={busy}
                            onCancel={() => {
                              setEditingPostId(null)
                            }}
                            onSave={async (content, tagsArray, imageFile) => 
                              await savePostEdits(p._id, content, tagsArray, imageFile)
                            }
                          />
                        )}

                        {expandedComments[p._id] && (
                          <div className="comments">
                            <div className="row">
                              <TextInput label="Dodaj komentarz" value={commentPostId === p._id ? commentContent : ''} onChange={(v) => { setCommentPostId(p._id); setCommentContent(v) }} />
                              <Button disabled={busy} onClick={() => addInlineComment(p._id, commentPostId === p._id ? commentContent : '')}>Dodaj</Button>
                            </div>
                            <ul className="list">
                              {(commentsByPost[p._id] || []).map(c => (
                                <li key={c._id} className="comment">
                                  <Avatar name={c.author?.username || 'Anon'} />
                                  <div>
                                    <div><strong>{c.author?.username || 'anon'}</strong> <span className="muted">• {timeAgo(c.createdAt)}</span></div>
                                    <div>{c.text}</div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </Section>
              </div>

              <aside className="sidebar">
                <div className="box">
                  <h3>Trendujące tagi</h3>
                  <div className="row" style={{gap:8, flexWrap:'wrap'}}>
                    {trendingTags.length ? trendingTags.map(t => (
                      <Button key={t.tag} className="secondary" onClick={() => setSearch(t.tag)}>{`#${t.tag} (${t.count})`}</Button>
                    )) : <span className="muted">Brak danych</span>}
                  </div>
                </div>

                <div className="box" style={{marginTop:12}}>
                  <h3>Mój profil</h3>
                  {me ? (
                    <div>
                      <div className="row" style={{cursor:'pointer'}} onClick={() => navigate('profile', { username: me.username })}><Avatar name={me.username} /><strong>{me.username}</strong></div>
                      <div className="muted">{me.email}</div>
                      <div className="row" style={{marginTop:8}}>
                        <Button className="secondary" onClick={loadMe}>Odśwież</Button>
                        <Button onClick={doLogout}>Wyloguj</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="muted">Zaloguj się z paska u góry, aby zobaczyć profil.</div>
                  )}
                </div>
              </aside>
            </div>
          </div>

          {authOpen && (
            <div className="modal-backdrop" onClick={() => setAuthOpen(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="tabs">
                  <div className={`tab ${authTab==='login' ? 'active' : ''}`} onClick={() => setAuthTab('login')}>Logowanie</div>
                  <div className={`tab ${authTab==='register' ? 'active' : ''}`} onClick={() => setAuthTab('register')}>Rejestracja</div>
                </div>
                {authTab === 'register' ? (
                  <div>
                    <TextInput label="Username" value={reg.username} onChange={(v) => setReg({ ...reg, username: v })} />
                    <TextInput label="Email" value={reg.email} onChange={(v) => setReg({ ...reg, email: v })} />
                    <TextInput label="Hasło" type="password" value={reg.password} onChange={(v) => setReg({ ...reg, password: v })} />
                    <div className="actions">
                      <Button className="secondary" onClick={() => setAuthOpen(false)}>Anuluj</Button>
                      <Button disabled={busy} onClick={async () => {
                        const ok = await doRegister()
                        if (ok) setAuthOpen(false)
                      }}>Zarejestruj</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <TextInput label="Email" value={log.email} onChange={(v) => setLog({ ...log, email: v })} />
                    <TextInput label="Hasło" type="password" value={log.password} onChange={(v) => setLog({ ...log, password: v })} />
                    <div className="actions">
                      <Button className="secondary" onClick={() => setAuthOpen(false)}>Anuluj</Button>
                      <Button disabled={busy} onClick={async () => {
                        const ok = await doLogin()
                        if (ok) setAuthOpen(false)
                      }}>Zaloguj</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <ProfilePage />
      )}

      <Toasts />
    </>
  )
}