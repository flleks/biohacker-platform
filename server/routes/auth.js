const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Wymagane: username, email, password' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Nieprawidłowy format email' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Hasło musi mieć co najmniej 6 znaków' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: 'Użytkownik już istnieje' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // ZMIANA: dodano avatarUrl
    return res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        avatarUrl: user.avatarUrl 
      } 
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Wymagane: email, password' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // ZMIANA: dodano avatarUrl
    return res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        avatarUrl: user.avatarUrl 
      } 
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    // Tu select zwraca wszystko oprócz hasła, więc avatarUrl też będzie
    const user = await User.findById(req.user.id).select('-passwordHash');
    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;