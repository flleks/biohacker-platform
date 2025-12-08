// server/routes/users.js
const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:username/posts  (posts by username) --- PUT this BEFORE /:username to avoid route collision
router.get('/:username/posts', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika' });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username');
    return res.json({ posts });
  } catch (err) {
    console.error('GET /api/users/:username/posts', err);
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// GET /api/users/:username (public profile)
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

// PUT /api/users/:id  (edit profile) -- auth required, only owner
router.put('/:id', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    if (String(uid) !== String(req.params.id)) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    const { username, email, bio } = req.body;
    const update = {};
    if (typeof username !== 'undefined') update.username = username;
    if (typeof email !== 'undefined') update.email = email;
    if (typeof bio !== 'undefined') update.bio = bio;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
    return res.json({ user });
  } catch (err) {
    console.error('PUT /api/users/:id', err);
    if (err.code === 11000) {
      // duplicate key (unique username/email)
      return res.status(409).json({ message: 'Username lub email zajęty' });
    }
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

module.exports = router;