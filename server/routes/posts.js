const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Upewnij się, że katalog uploads istnieje
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Opcjonalna obsługa Sharp do optymalizacji zdjęć
let sharp;
try { sharp = require('sharp'); } catch (e) { sharp = null; }

// --- KONFIGURACJA MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    // Unikalna nazwa pliku
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Tylko pliki obrazów są dozwolone'));
  }
});

// --- FUNKCJE POMOCNICZE (DRY - Don't Repeat Yourself) ---

// Parsowanie tagów z FormData
const parseTags = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try { return JSON.parse(input); } catch (e) {}
  return input.toString().split(',').map(s => s.trim()).filter(Boolean);
};

// Parsowanie detali eksperymentu z JSON string (FormData przesyła obiekty jako stringi)
const parseExperimentDetails = (input) => {
  if (!input) return {};
  if (typeof input === 'object') return input;
  try { return JSON.parse(input); } catch (e) { return {}; }
};

// Przetwarzanie obrazka (Resize + Metadane)
const processImage = async (file) => {
  if (!file) return { imageUrl: null, imageMeta: null };
  
  const filePath = path.join(UPLOAD_DIR, file.filename);
  let meta = { size: fs.statSync(filePath).size, width: null, height: null };

  if (sharp) {
    try {
      const optPath = path.join(UPLOAD_DIR, `opt-${file.filename}`);
      // Resize do max 1200px szerokości, zachowaj proporcje
      await sharp(filePath)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(optPath);
      
      fs.unlinkSync(filePath); // Usuń oryginał
      fs.renameSync(optPath, filePath); // Nadpisz zoptymalizowanym

      const m = await sharp(filePath).metadata();
      meta = { ...meta, width: m.width, height: m.height, size: fs.statSync(filePath).size };
    } catch (e) { console.warn('Sharp optimization warning:', e.message); }
  }
  
  return { imageUrl: `/uploads/${file.filename}`, imageMeta: meta };
};

// Bezpieczne usuwanie pliku
const deleteFile = (url) => {
  if (!url) return;
  const fileName = path.basename(url);
  const p = path.join(UPLOAD_DIR, fileName);
  if (fileName && !fileName.includes('..') && fs.existsSync(p)) {
    try { fs.unlinkSync(p); } catch (e) { console.warn('Delete file warning:', e.message); }
  }
};

// --- ROUTING ---

// 1. POBIERANIE WSZYSTKICH POSTÓW
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

// 2. POBIERANIE POJEDYNCZEGO POSTA
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username email avatarUrl');
    
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// 3. TWORZENIE POSTA (Normalny lub Eksperyment)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Treść jest wymagana' });

    // Obsługa typu posta i detali eksperymentu
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
      experimentDetails
    });
    
    // Zwracamy post z danymi autora
    post = await Post.findById(post._id).populate('author', 'username email avatarUrl');
    res.status(201).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// 4. EDYCJA POSTA
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });
    
    // Sprawdzenie czy to autor
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Brak uprawnień do edycji' });
    }

    // Aktualizacja podstawowych pól
    if (req.body.content !== undefined) post.content = req.body.content.trim();
    if (req.body.tags !== undefined) post.tags = parseTags(req.body.tags);

    // Aktualizacja pól eksperymentu
    if (req.body.type) post.type = req.body.type;
    if (req.body.experimentDetails) {
      const newDetails = parseExperimentDetails(req.body.experimentDetails);
      // Merge starych detali z nowymi
      post.experimentDetails = { ...post.experimentDetails, ...newDetails };
    }

    // Obsługa wymiany zdjęcia
    if (req.file) {
      deleteFile(post.imageUrl); // Usuwamy stare
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

// 5. USUWANIE POSTA
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    deleteFile(post.imageUrl);
    await post.deleteOne();
    
    res.json({ message: 'Post usunięty' });
  } catch (err) {
    res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// 6. LIKE / UNLIKE
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Brak posta' });

    const uid = req.user._id.toString();
    const index = post.likes.indexOf(uid);

    if (index === -1) {
      post.likes.push(uid); // Like
    } else {
      post.likes.splice(index, 1); // Unlike
    }

    await post.save();
    res.json({ likesCount: post.likes.length, liked: index === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. DODAWANIE KOMENTARZA
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Brak tekstu komentarza' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Brak posta' });

    const newComment = {
      author: req.user._id,
      text,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Zwracamy zaktualizowaną listę komentarzy z danymi autorów
    await post.populate('comments.author', 'username');
    res.status(201).json({ comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POBIERANIE KOMENTARZY
router.get('/:id/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.author', 'username');
    if (!post) return res.status(404).json({ message: 'Brak posta' });
    
    res.json({ comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;