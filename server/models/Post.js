// server/models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    // new: image fields
    imageUrl: { type: String, default: null }, // np. "/uploads/12345.jpg" lub pełny URL S3
    imageMeta: {
      width: Number,
      height: Number,
      size: Number // bytes
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);