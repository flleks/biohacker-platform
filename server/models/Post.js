const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  tags: [String],
  imageUrl: String,
  imageMeta: {
    width: Number,
    height: Number,
    size: Number
  },
  
  // --- NOWE POLE: LICZNIK WYŚWIETLEŃ ---
  views: {
    type: Number,
    default: 0
  },
  // -------------------------------------

  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],

  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // --- POLA DLA BIOHACKINGU ---
  type: { 
    type: String, 
    enum: ['normal', 'experiment'], 
    default: 'normal' 
  },
  
  experimentDetails: {
    title: String,
    goal: String,
    duration: String,
    status: { 
      type: String, 
      enum: ['planned', 'active', 'completed', 'failed'],
      default: 'active'
    },
    results: String
  }

}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);