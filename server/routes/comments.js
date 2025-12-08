const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// List comments by post
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate('author', 'username');
    return res.json({ comments });
  } catch (err) {
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

// Create comment
router.post('/', auth, async (req, res) => {
  try {
    const { postId, content } = req.body;
    if (!postId || !content) return res.status(400).json({ message: 'Wymagane: postId, content' });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post nie znaleziony' });
    const comment = await Comment.create({ post: postId, author: req.user.id, content });
    const populated = await comment.populate('author', 'username');
    return res.status(201).json({ comment: populated });
  } catch (err) {
    return res.status(500).json({ message: 'Błąd serwera', error: err.message });
  }
});

module.exports = router;


