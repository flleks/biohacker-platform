const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null; 
}

// Konfiguracja Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Bezpieczniejsza nazwa pliku (unikanie kolizji)
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    // Prosta walidacja po MIME type (wystarczająca na inżynierkę)
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Tylko pliki obrazów są dozwolone'));
    cb(null, true);
  }
});

// Funkcja pomocnicza do parsowania tagów
const parseTags = (tagsInput) => {
  if (!tagsInput) return [];
  if (Array.isArray(tagsInput)) return tagsInput;
  
  try {
    // Próba sparsowania JSON (jeśli frontend wysyła stringify tablicy)
    const parsed = JSON.parse(tagsInput);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // Ignorujemy błąd JSON, traktujemy jako string po przecinku
  }
  
  // Fallback: string oddzielony przecinkami
  return tagsInput.toString().split(',').map(s => s.trim()).filter(Boolean);
};

// -------------------- LIST / GET --------------------
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.author) {
      const a = req.query.author;
      // Walidacja ID MongoDB
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

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username email');
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });
    return res.json({ post });
  } catch (err) {
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// -------------------- CREATE POST --------------------
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Wymagane: content' });

    // Użycie helpera do tagów
    const tags = parseTags(req.body.tags);
    const authorId = req.user._id;

    let imageUrl = null;
    let imageMeta = null;

    if (req.file) {
      const filePath = path.join(UPLOAD_DIR, req.file.filename);
      
      // Obsługa Sharp (optymalizacja)
      if (sharp) {
        try {
          const optimizedPath = path.join(UPLOAD_DIR, `opt-${req.file.filename}`);
          await sharp(filePath)
            .rotate()
            .resize({ width: 1200, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(optimizedPath);
            
          // Zastąp oryginał zoptymalizowanym plikiem
          fs.unlinkSync(filePath);
          fs.renameSync(optimizedPath, filePath);
        } catch (e) {
          console.warn('Sharp optimization failed:', e.message);
        }
      }

      // Metadata
      try {
        const stats = fs.statSync(filePath);
        if (sharp) {
          const meta = await sharp(filePath).metadata();
          imageMeta = { width: meta.width, height: meta.height, size: stats.size };
        } else {
          imageMeta = { width: null, height: null, size: stats.size };
        }
      } catch (e) {
        console.warn('Metadata error:', e.message);
      }

      imageUrl = `/uploads/${req.file.filename}`;
    }

    const post = await Post.create({ author: authorId, content, tags, imageUrl, imageMeta });
    const populated = await Post.findById(post._id).populate('author', 'username email');
    return res.status(201).json({ post: populated });
  } catch (err) {
    console.error('POST /api/posts error:', err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// -------------------- UPDATE POST --------------------
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    // POPRAWKA: req.body w multipart/form-data ma spłaszczone struktury. 
    // Tagi przyjdą jako string, więc musimy użyć parseTags.
    const { content, tags } = req.body;
    
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });

    // Sprawdzenie uprawnień
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Brak uprawnień do edycji tego posta' });
    }

    if (content !== undefined) post.content = content.trim();
    if (tags !== undefined) post.tags = parseTags(tags);

    if (req.file) {
      // Usunięcie starego zdjęcia
      if (post.imageUrl) {
        const oldFileName = path.basename(post.imageUrl);
        const oldPath = path.join(UPLOAD_DIR, oldFileName);
        // Sprawdź czy path jest bezpieczny i plik istnieje
        if (oldFileName && !oldFileName.includes('..') && fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch(e) { console.warn('Could not delete old image', e); }
        }
      }

      // Przetwarzanie nowego pliku (powtórzenie logiki z POST - w idealnym świecie wyciągnij to do serwisu)
      const filePath = path.join(UPLOAD_DIR, req.file.filename);
      if (sharp) {
        try {
          const optimizedPath = path.join(UPLOAD_DIR, `opt-${req.file.filename}`);
          await sharp(filePath).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(optimizedPath);
          fs.unlinkSync(filePath);
          fs.renameSync(optimizedPath, filePath);
        } catch (e) { console.warn(e); }
      }

      post.imageUrl = `/uploads/${req.file.filename}`;
      // Aktualizacja metadanych... (skrótowo dla czytelności)
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

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    if (post.imageUrl) {
      const fileName = path.basename(post.imageUrl);
      const filePath = path.join(UPLOAD_DIR, fileName);
      if (fileName && !fileName.includes('..') && fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch(e) { console.warn(e); }
      }
    }

    await post.deleteOne();
    return res.json({ message: 'Post usunięty' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// ... reszta routów (like, comments) bez większych zmian logicznych, 
// jedynie upewnij się że req.user._id jest używane konsekwentnie.

// -------------------- LIKE/UNLIKE --------------------
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });

    const uid = req.user._id.toString();
    const hasLiked = post.likes.some((l) => l.toString() === uid);

    if (hasLiked) post.likes = post.likes.filter(l => l.toString() !== uid);
    else post.likes.push(uid);

    await post.save();
    return res.json({ likesCount: post.likes.length, liked: !hasLiked });
  } catch (err) {
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

    // Zakładam, że w modelu Post.js masz zdefiniowane comments jako tablicę obiektów
    const comment = { author: req.user._id, text, createdAt: new Date() };
    post.comments.push(comment);
    await post.save();

    // Mongoose wymaga ponownego pobrania lub populate na zapisanym obiekcie, 
    // aby zwrócić pełne dane autora komentarza
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