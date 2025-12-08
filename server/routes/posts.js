const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// --- uploads dir (server/uploads) ---
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// optional sharp (if installed)
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null; // brak optymalizacji
}

// multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,9)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Tylko pliki obrazów są dozwolone'));
    cb(null, true);
  }
});

// -------------------- LIST / GET --------------------

// List posts (supports ?author=)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.author) {
      const a = req.query.author;
      if (typeof a !== 'string' || !/^[0-9a-fA-F]{24}$/.test(a)) return res.json({ posts: [] });
      filter.author = a;
    }
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate('author', 'username email');
    return res.json({ posts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username email');
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });
    return res.json({ post });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// -------------------- CREATE POST --------------------
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Wymagane: content' });

    let tags = [];
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
        if (!Array.isArray(tags)) tags = [];
      } catch {
        tags = (req.body.tags || '').split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    const authorId = req.user._id || req.user.id;

    let imageUrl = null;
    let imageMeta = null;

    if (req.file) {
      const filePath = path.join(UPLOAD_DIR, req.file.filename);

      if (sharp) {
        try {
          const optimizedPath = path.join(UPLOAD_DIR, `opt-${req.file.filename}`);
          await sharp(filePath)
            .rotate()
            .resize({ width: 1200, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(optimizedPath);
          fs.unlinkSync(filePath);
          fs.renameSync(optimizedPath, filePath);
        } catch (e) {
          console.warn('Sharp failed, keeping original file', e.message || e);
        }
      }

      try {
        const stats = fs.statSync(filePath);
        if (sharp) {
          const meta = await sharp(filePath).metadata();
          imageMeta = { width: meta.width || null, height: meta.height || null, size: stats.size };
        } else {
          imageMeta = { width: null, height: null, size: stats.size };
        }
      } catch (e) {
        console.warn('Failed to get image metadata', e.message || e);
      }

      imageUrl = `/uploads/${req.file.filename}`;
    }

    const post = await Post.create({ author: authorId, content, tags, imageUrl, imageMeta });
    const populated = await Post.findById(post._id).populate('author', 'username email').lean();
    return res.status(201).json({ post: populated });
  } catch (err) {
    console.error('POST /api/posts error:', err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// -------------------- UPDATE POST --------------------
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { content, tags } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });

    const requesterId = (req.user._id || req.user.id).toString();
    if (String(post.author) !== requesterId) return res.status(403).json({ message: 'Brak uprawnień' });

    if (typeof content === 'string') post.content = content;
    if (Array.isArray(tags)) post.tags = tags;

    if (req.file) {
      if (post.imageUrl) {
        const oldFile = path.join(UPLOAD_DIR, path.basename(post.imageUrl));
        try { if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile); } catch(e){ console.warn(e); }
      }
      const filePath = path.join(UPLOAD_DIR, req.file.filename);

      if (sharp) {
        try {
          const optimizedPath = path.join(UPLOAD_DIR, `opt-${req.file.filename}`);
          await sharp(filePath).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(optimizedPath);
          fs.unlinkSync(filePath);
          fs.renameSync(optimizedPath, filePath);
        } catch (e) { console.warn('Sharp failed', e.message || e); }
      }

      try {
        const stats = fs.statSync(filePath);
        if (sharp) {
          const meta = await sharp(filePath).metadata();
          post.imageMeta = { width: meta.width || null, height: meta.height || null, size: stats.size };
        } else post.imageMeta = { width: null, height: null, size: stats.size };
      } catch (e) { console.warn('Failed to get metadata', e); }

      post.imageUrl = `/uploads/${req.file.filename}`;
    }

    await post.save();
    const populated = await Post.findById(post._id).populate('author', 'username email');
    return res.json({ post: populated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// -------------------- DELETE POST --------------------
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });

    const requesterId = (req.user._id || req.user.id).toString();
    if (String(post.author) !== requesterId) return res.status(403).json({ message: 'Brak uprawnień' });

    if (post.imageUrl) {
      const file = path.join(UPLOAD_DIR, path.basename(post.imageUrl));
      try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch(e){ console.warn(e); }
    }

    await post.deleteOne();
    return res.json({ message: 'Usunięto' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// -------------------- LIKE/UNLIKE --------------------
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });

    const uid = (req.user._id || req.user.id).toString();
    const hasLiked = post.likes.some((l) => String(l) === uid);

    if (hasLiked) post.likes = post.likes.filter(l => String(l) !== uid);
    else post.likes.push(uid);

    await post.save();
    return res.json({ likesCount: post.likes.length, liked: !hasLiked });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// -------------------- COMMENTS --------------------
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Wymagany tekst komentarza' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });

    const comment = { author: req.user.id, text, createdAt: new Date() };
    post.comments.push(comment);
    await post.save();

    await post.populate('comments.author', 'username');
    return res.status(201).json({ comments: post.comments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.author', 'username');
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });
    return res.json({ comments: post.comments });
  } catch (err) {
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

module.exports = router;