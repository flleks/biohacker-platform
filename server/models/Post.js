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
  
  // Obsługa obrazków
  imageUrl: String,
  imageMeta: {
    width: Number,
    height: Number,
    size: Number
  },

  // System polubień
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],

  // System komentarzy
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // --- BIOHACKING: Nowe pola dla eksperymentów ---
  type: { 
    type: String, 
    enum: ['normal', 'experiment'], // Rozróżniamy zwykły post od eksperymentu
    default: 'normal' 
  },
  
  experimentDetails: {
    title: String,      // np. "Protokół Wim Hofa - Tydzień 1"
    goal: String,       // np. "Zwiększenie odporności na zimno"
    duration: String,   // np. "30 dni"
    status: {           // Status widoczny na zielonej ramce
      type: String, 
      enum: ['planned', 'active', 'completed', 'failed'],
      default: 'active'
    },
    results: String     // Miejsce na podsumowanie wyników
  }
  // ----------------------------------------------

}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);