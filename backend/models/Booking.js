const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    movieTitle: String,
    moviePoster: String,
    movieBg: String,
    cinema: String,
    screen: String,
    date: String,
    time: String,
    format: { type: String, default: '2D' },
    language: { type: String, default: 'Hindi' },
    seats: [String],
    seatCategory: String,
    basePrice: Number,
    convenienceFee: Number,
    discount: { type: Number, default: 0 },
    totalAmount: Number,
    paymentMethod: { type: String, default: 'UPI' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'paid' },
    status: { type: String, enum: ['confirmed', 'cancelled', 'used'], default: 'confirmed' },
    loyaltyPointsEarned: { type: Number, default: 0 },
    couponApplied: String,
    bookedAt: { type: Date, default: Date.now }
});

bookingSchema.pre('save', function (next) {
    if (!this.bookingId) {
        this.bookingId = 'MZ' + Date.now().toString(36).toUpperCase().slice(-6) +
            Math.random().toString(36).slice(2, 5).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);