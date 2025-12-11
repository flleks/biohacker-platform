const mongoose = require('mongoose');

// Schemat komentarza zagnieżdżonego
const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Tablica ID userów
    
    // Zagnieżdżona tablica komentarzy
    comments: [commentSchema], 
    
    imageUrl: { type: String, default: null },
    imageMeta: {
      width: Number,
      height: Number,
      size: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);