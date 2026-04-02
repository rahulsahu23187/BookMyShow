const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: String,
    emoji: String,
    bg: String,
    description: String,
    venue: String,
    city: { type: String, default: 'Mumbai' },
    date: String,
    time: String,
    duration: String,
    price: Number,
    priceLabel: String,
    artist: String,
    featured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);