// Node 18+ ma globalny fetch
const base = process.env.BASE_URL || 'http://localhost:4000';

function logStep(name, data) {
  console.log(`\n=== ${name} ===`);
  if (data) console.log(data);
}

async function main() {
  try {
    // 1) Health
    const healthRes = await fetch(`${base}/health`);
    const health = await healthRes.json();
    logStep('Health', health);

    // 2) Register (unikalny użytkownik)
    const uid = Date.now();
    const email = `test${uid}@example.com`;
    const password = 'Secret123!';
    const username = `user${uid}`;
    const regRes = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const reg = await regRes.json();
    logStep('Register', reg);

    // 3) Login
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const login = await loginRes.json();
    if (!login.token) throw new Error('Brak tokenu w odpowiedzi logowania');
    const token = login.token;
    logStep('Login', { user: login.user });

    // 4) Me
    const meRes = await fetch(`${base}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const me = await meRes.json();
    logStep('Me', me);

    // 5) Create post
    const createPostRes = await fetch(`${base}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: 'Mój pierwszy biohack!', tags: ['sleep'] })
    });
    const createdPost = await createPostRes.json();
    const postId = createdPost.post?._id || createdPost.post?.id;
    if (!postId) throw new Error('Nie udało się utworzyć posta');
    logStep('Create Post', createdPost);

    // 6) List posts
    const listRes = await fetch(`${base}/api/posts`);
    const list = await listRes.json();
    logStep('List Posts (count)', { count: list.posts?.length });

    // 7) Like/Unlike
    const likeRes = await fetch(`${base}/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const like = await likeRes.json();
    logStep('Like Toggle', like);

    // 8) Add comment
    const commentRes = await fetch(`${base}/api/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ postId, content: 'Super tip!' })
    });
    const comment = await commentRes.json();
    logStep('Add Comment', comment);

    // 9) List comments
    const commentsListRes = await fetch(`${base}/api/comments/post/${postId}`);
    const commentsList = await commentsListRes.json();
    logStep('List Comments (count)', { count: commentsList.comments?.length });

    // 10) Delete post
    const delRes = await fetch(`${base}/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const del = await delRes.json();
    logStep('Delete Post', del);

    console.log('\nSmoke test: OK');
  } catch (err) {
    console.error('Smoke test: FAILED');
    console.error(err);
    process.exit(1);
  }
}

main();


