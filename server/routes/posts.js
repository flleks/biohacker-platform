const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let sharp;
try { sharp = require('sharp'); } catch (e) { sharp = null; }

// --- KONFIGURACJA MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Tylko pliki obrazów są dozwolone'));
  }
});

// --- POMOCNICZE FUNKCJE ---
const parseTags = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try { return JSON.parse(input); } catch (e) {}
  return input.toString().split(',').map(s => s.trim()).filter(Boolean);
};

const parseExperimentDetails = (input) => {
  if (!input) return {};
  if (typeof input === 'object') return input;
  try { return JSON.parse(input); } catch (e) { return {}; }
};

const processImage = async (file) => {
  if (!file) return { imageUrl: null, imageMeta: null };
  const filePath = path.join(UPLOAD_DIR, file.filename);
  let meta = { size: fs.statSync(filePath).size, width: null, height: null };

  if (sharp) {
    try {
      const optPath = path.join(UPLOAD_DIR, `opt-${file.filename}`);
      await sharp(filePath).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(optPath);
      fs.unlinkSync(filePath);
      fs.renameSync(optPath, filePath);
      const m = await sharp(filePath).metadata();
      meta = { ...meta, width: m.width, height: m.height, size: fs.statSync(filePath).size };
    } catch (e) { console.warn('Sharp warning:', e.message); }
  }
  return { imageUrl: `/uploads/${file.filename}`, imageMeta: meta };
};

const deleteFile = (url) => {
  if (!url) return;
  const fileName = path.basename(url);
  const p = path.join(UPLOAD_DIR, fileName);
  if (fileName && !fileName.includes('..') && fs.existsSync(p)) {
    try { fs.unlinkSync(p); } catch (e) {}
  }
};

// --- ROUTING ---

// 1. LISTA POSTÓW
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.author && /^[0-9a-fA-F]{24}$/.test(req.query.author)) {
      filter.author = req.query.author;
    }
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate('author', 'username email avatarUrl');
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// 2. POJEDYNCZY POST (ZINKREMENTUJ VIEWS)
router.get('/:id', async (req, res) => {
  try {
    // Używamy findByIdAndUpdate z $inc, aby zwiększyć licznik atomowo
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } }, // Zwiększ views o 1
      { new: true } // Zwróć zaktualizowany dokument
    )
    .populate('author', 'username email avatarUrl')
    .populate('comments.author', 'username avatarUrl'); // Przy okazji pobierz dane autorów komentarzy
    
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// 3. TWORZENIE POSTA
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Treść jest wymagana' });

    const type = req.body.type === 'experiment' ? 'experiment' : 'normal';
    const experimentDetails = type === 'experiment' ? parseExperimentDetails(req.body.experimentDetails) : {};

    const { imageUrl, imageMeta } = await processImage(req.file);
    
    let post = await Post.create({
      author: req.user._id,
      content,
      tags: parseTags(req.body.tags),
      imageUrl,
      imageMeta,
      type,
      experimentDetails,
      views: 0 // Startujemy od zera
    });
    
    post = await Post.findById(post._id).populate('author', 'username email avatarUrl');
    res.status(201).json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// 4. EDYCJA POSTA
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Brak uprawnień' });

    if (req.body.content !== undefined) post.content = req.body.content.trim();
    if (req.body.tags !== undefined) post.tags = parseTags(req.body.tags);

    if (req.body.type) post.type = req.body.type;
    if (req.body.experimentDetails) {
      const newDetails = parseExperimentDetails(req.body.experimentDetails);
      post.experimentDetails = { ...post.experimentDetails, ...newDetails };
    }

    if (req.file) {
      deleteFile(post.imageUrl);
      const { imageUrl, imageMeta } = await processImage(req.file);
      post.imageUrl = imageUrl;
      if (imageMeta) post.imageMeta = imageMeta;
    }

    await post.save();
    const populated = await Post.findById(post._id).populate('author', 'username email avatarUrl');
    res.json({ post: populated });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// 5. USUWANIE
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Nie znaleziono' });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Brak uprawnień' });

    deleteFile(post.imageUrl);
    await post.deleteOne();
    res.json({ message: 'Post usunięty' });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// 6. LIKE
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Brak posta' });

    const uid = req.user._id.toString();
    const index = post.likes.indexOf(uid);
    if (index === -1) post.likes.push(uid);
    else post.likes.splice(index, 1);

    await post.save();
    res.json({ likesCount: post.likes.length, liked: index === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. KOMENTARZE
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Brak tekstu' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Brak posta' });

    post.comments.push({ author: req.user._id, text, createdAt: new Date() });
    await post.save();
    await post.populate('comments.author', 'username avatarUrl');
    res.status(201).json({ comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.author', 'username avatarUrl');
    if (!post) return res.status(404).json({ message: 'Brak posta' });
    res.json({ comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;