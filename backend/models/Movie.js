const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    poster: { type: String, default: '🎬' },
    bg: { type: String, default: '#1a1a2e' },
    accent: { type: String, default: '#e50914' },
    rating: { type: Number, default: 7.0 },
    votes: { type: String, default: '10K' },
    genre: { type: [String], default: [] },
    lang: { type: [String], default: [] },
    duration: { type: String, default: '2h 00m' },
    releaseDate: { type: String, default: '' },
    certificate: { type: String, default: 'U/A' },
    description: { type: String, default: '' },
    cast: [{
        name: { type: String, default: '' },
        role: { type: String, default: '' },
        emoji: { type: String, default: '' },
        color: { type: String, default: '' }
    }],
    formats: { type: [String], default: [] },
    price: {
        economy: { type: Number, default: 150 },
        regular: { type: Number, default: 220 },
        premium: { type: Number, default: 320 },
        recliner: { type: Number, default: 450 }
    },
    trending: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
    upcoming: { type: Boolean, default: false },
    popular: { type: Boolean, default: false },
    nowShowing: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    boxOffice: {
        opening: { type: String, default: '' },
        weekend: { type: String, default: '' },
        total: { type: String, default: '' },
        budget: { type: String, default: '' }
    },
    views: { type: Number, default: 0 }
}, { timestamps: true });

movieSchema.index({ title: 'text', description: 'text' });
module.exports = mongoose.model('Movie', movieSchema);