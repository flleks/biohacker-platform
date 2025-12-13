const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Konfiguracja Multer (zapisywanie plików)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    // Upewnij się, że katalog istnieje
    if (!fs.existsSync(uploadPath)){
        fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Unikalna nazwa pliku: timestamp + losowa liczba + rozszerzenie
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// GET /api/users/:username/posts
router.get('/:username/posts', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika' });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username email avatarUrl'); // Dodano avatarUrl do populate
      
    return res.json({ posts });
  } catch (err) {
    console.error('GET /api/users/:username/posts', err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// GET /api/users/:username (publiczny profil)
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    return res.json({ user });
  } catch (err) {
    console.error('GET /api/users/:username', err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// PUT /api/users/:id (edycja profilu + AVATAR)
// Dodano middleware: upload.single('avatar')
router.put('/:id', auth, upload.single('avatar'), async (req, res) => {
  try {
    const uid = req.user._id.toString(); 
    if (uid !== req.params.id) {
      return res.status(403).json({ message: 'Brak uprawnień do edycji tego profilu' });
    }

    const { username, email, bio } = req.body;
    const update = {};

    // WALIDACJA
    if (username && typeof username === 'string') { // Poprawka na check typu
      if (username.trim().length < 3) {
        return res.status(400).json({ message: 'Nazwa użytkownika jest za krótka' });
      }
      update.username = username.trim();
    }

    if (email && typeof email === 'string') {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Nieprawidłowy format email' });
      }
      update.email = email.trim().toLowerCase();
    }

    if (typeof bio !== 'undefined') {
      update.bio = bio.trim();
    }

    // Obsługa pliku awatara
    if (req.file) {
      // Zapisujemy ścieżkę dostępu. Zakładamy, że serwer serwuje statycznie folder uploads
      update.avatarUrl = '/uploads/' + req.file.filename;
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
    
    return res.json({ user });
  } catch (err) {
    console.error('PUT /api/users/:id', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Taka nazwa użytkownika lub email jest już zajęty' });
    }
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// DELETE /api/users/:id (trwałe usunięcie konta)
router.delete('/:id', auth, async (req, res) => {
  try {
    const uid = req.user._id.toString();
    
    if (uid !== req.params.id) {
      return res.status(403).json({ message: 'Brak uprawnień do usunięcia tego konta' });
    }

    await Post.deleteMany({ author: uid });
    await Post.updateMany({ likes: uid }, { $pull: { likes: uid } });
    
    const deletedUser = await User.findByIdAndDelete(uid);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Użytkownik nie istnieje' });
    }

    return res.json({ message: 'Procedura zakończona. Konto usunięte z bazy danych.' });
  } catch (err) {
    console.error('DELETE /api/users/:id', err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

module.exports = router;