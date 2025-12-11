const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/users/:username/posts
router.get('/:username/posts', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika' });

    // Pobieramy posty tego użytkownika
    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username email'); // Populate autora
      
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

// PUT /api/users/:id (edycja profilu)
router.put('/:id', auth, async (req, res) => {
  try {
    // Sprawdzenie uprawnień: czy edytujący to właściciel konta?
    // Używamy req.user._id (zgodnie z poprawionym auth middleware)
    const uid = req.user._id.toString(); 
    if (uid !== req.params.id) {
      return res.status(403).json({ message: 'Brak uprawnień do edycji tego profilu' });
    }

    const { username, email, bio } = req.body;
    const update = {};

    // WALIDACJA (Dodano dla bezpieczeństwa inżynierki)
    if (typeof username !== 'undefined') {
      if (username.trim().length < 3) {
        return res.status(400).json({ message: 'Nazwa użytkownika jest za krótka' });
      }
      update.username = username.trim();
    }

    if (typeof email !== 'undefined') {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Nieprawidłowy format email' });
      }
      update.email = email.trim().toLowerCase();
    }

    if (typeof bio !== 'undefined') {
      update.bio = bio.trim(); // Bio może być puste, ale trimujemy
    }

    // { new: true } zwraca obiekt PO edycji
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

module.exports = router;