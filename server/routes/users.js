const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Konfiguracja Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)){
        fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Helper do bezpiecznego usuwania plików
const removeFile = (fileUrl) => {
  if (!fileUrl) return;
  try {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn(`Nie udało się usunąć pliku ${fileUrl}:`, err.message);
  }
};

// GET /api/users/:username - Profil + Statystyki
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika' });

    // --- NOWOŚĆ: Obliczanie sumy wyświetleń ---
    const stats = await Post.aggregate([
      { $match: { author: user._id } }, // Wybierz posty tego autora
      { $group: { _id: null, totalViews: { $sum: "$views" } } } // Zsumuj pole views
    ]);

    const totalViews = stats.length > 0 ? stats[0].totalViews : 0;
    // ------------------------------------------

    // Zwracamy obiekt usera oraz totalViews
    return res.json({ user, totalViews });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// GET /api/users/:username/posts (Opcjonalny, bo używamy głównego /api/posts z filtrami)
router.get('/:username/posts', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika' });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username email avatarUrl');
      
    return res.json({ posts });
  } catch (err) {
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// PUT /api/users/:id (edycja profilu)
router.put('/:id', auth, upload.single('avatar'), async (req, res) => {
  try {
    const uid = req.user._id.toString(); 
    if (uid !== req.params.id) {
      return res.status(403).json({ message: 'Brak uprawnień do edycji tego profilu' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Użytkownik nie istnieje' });

    const { username, email, bio } = req.body;

    if (username && typeof username === 'string') {
      if (username.trim().length < 3) return res.status(400).json({ message: 'Nazwa użytkownika za krótka' });
      user.username = username.trim();
    }

    if (email && typeof email === 'string') {
      if (!emailRegex.test(email)) return res.status(400).json({ message: 'Błędny email' });
      user.email = email.trim().toLowerCase();
    }

    if (typeof bio !== 'undefined') {
      user.bio = bio.trim();
    }

    if (req.file) {
      if (user.avatarUrl) removeFile(user.avatarUrl);
      user.avatarUrl = '/uploads/' + req.file.filename;
    }

    await user.save();
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    return res.json({ user: userResponse });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Nazwa lub email zajęte' });
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const uid = req.user._id.toString();
    if (uid !== req.params.id) return res.status(403).json({ message: 'Brak uprawnień' });

    const userPosts = await Post.find({ author: uid });
    for (const post of userPosts) {
      if (post.imageUrl) removeFile(post.imageUrl);
    }
    await Post.deleteMany({ author: uid });
    await Post.updateMany({ likes: uid }, { $pull: { likes: uid } });
    
    const userToDelete = await User.findById(uid);
    if (userToDelete) {
        if (userToDelete.avatarUrl) removeFile(userToDelete.avatarUrl);
        await User.deleteOne({ _id: uid });
    } else {
        return res.status(404).json({ message: 'Użytkownik nie istnieje' });
    }

    return res.json({ message: 'Konto usunięte.' });
  } catch (err) {
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

module.exports = router;