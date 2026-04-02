const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const User = require('../models/User');
const { protect } = require('../middleware/Auth');

// POST /api/bookings
router.post('/', protect, async (req, res) => {
    try {
        const { movieId, cinema, screen, date, time, format, language,
                seats, seatCategory, basePrice, convenienceFee, totalAmount,
                paymentMethod, couponApplied, discount } = req.body;

        if (!seats || !seats.length)
            return res.status(400).json({ success: false, message: 'Select at least one seat' });

        // BUG FIX: was `await findById(movieId)` — missing Movie. prefix
        const movie = await Movie.findById(movieId);
        if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });

        const existing = await Booking.find({ movieId, cinema, date, time, status: { $ne: 'cancelled' } });
        const taken = existing.flatMap(b => b.seats);
        const conflict = seats.filter(s => taken.includes(s));
        if (conflict.length)
            return res.status(400).json({ success: false, message: `Seats already booked: ${conflict.join(', ')}` });

        const pts = Math.floor(totalAmount / 10);

        const booking = await Booking.create({
            userId: req.user._id,
            movieId,
            // BUG FIX: was `title`, `poster`, `bg` — undefined variables
            movieTitle: movie.title,
            moviePoster: movie.poster,
            movieBg: movie.bg,
            cinema,
            screen: screen || 'Screen 1',
            date, time,
            format: format || '2D',
            language: language || 'Hindi',
            seats,
            seatCategory: seatCategory || 'Regular',
            basePrice,
            convenienceFee: convenienceFee || Math.round(basePrice * 0.04),
            totalAmount,
            discount: discount || 0,
            paymentMethod: paymentMethod || 'UPI',
            couponApplied: couponApplied || '',
            loyaltyPointsEarned: pts
        });

        // BUG FIX: removed invalid `$push: {}` empty push
        await User.findByIdAndUpdate(req.user._id, { $inc: { loyaltyPoints: pts } });

        res.status(201).json({ success: true, booking, message: `Booking confirmed! +${pts} loyalty points earned.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/bookings/my
router.get('/my', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id })
            .sort({ bookedAt: -1 })
            .populate('movieId', 'title poster bg accent genre');
        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/bookings/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const booking = await Booking.findOne({
            $or: [
                { _id: req.params.id.match(/^[0-9a-f]{24}$/) ? req.params.id : null },
                { bookingId: req.params.id }
            ]
        }).populate('movieId', 'title poster bg accent lang');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/bookings/:id/cancel
router.delete('/:id/cancel', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.userId.toString() !== req.user._id.toString())
            return res.status(403).json({ success: false, message: 'Not your booking' });
        booking.status = 'cancelled';
        await booking.save();
        res.json({ success: true, message: 'Booking cancelled. Refund in 5-7 business days.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/bookings/coupon
router.post('/coupon', protect, async (req, res) => {
    const { code, amount } = req.body;
    const COUPONS = {
        'MOVIE10': { type: 'percent', value: 0.10, label: '10% Off' },
        'FIRST50': { type: 'flat', value: 50, label: '₹50 Off' },
        'WELCOME100': { type: 'flat', value: 100, label: '₹100 Off' },
        'MZ2026': { type: 'convfree', value: 0, label: 'Free Convenience Fee' },
        'IMAX20': { type: 'percent', value: 0.20, label: '20% Off' }
    };
    const c = COUPONS[code?.toUpperCase()];
    if (!c) return res.status(400).json({ success: false, message: 'Invalid coupon code' });
    let disc = 0;
    if (c.type === 'percent') disc = Math.round(amount * c.value);
    else if (c.type === 'flat') disc = c.value;
    else if (c.type === 'convfree') disc = Math.round(amount * 0.04);
    res.json({ success: true, discount: disc, label: c.label, code: code.toUpperCase() });
});

module.exports = router;