const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/Auth');

// GET /api/movies
router.get('/', async (req, res) => {
    try {
        const { genre, lang, minRating, search, trending, upcoming,
                popular, recommended, nowShowing, limit = 50, page = 1 } = req.query;
        const q = {};
        if (genre) q.genre = { $in: [genre] };
        if (lang) q.lang = { $in: [lang] };
        if (minRating) q.rating = { $gte: parseFloat(minRating) };
        if (trending === 'true') q.trending = true;
        if (upcoming === 'true') q.upcoming = true;
        if (popular === 'true') q.popular = true;
        if (recommended === 'true') q.recommended = true;
        if (nowShowing === 'true') q.nowShowing = true;
        if (search) {
            q.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { genre: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const movies = await Movie.find(q).sort({ rating: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit));
        const total = await Movie.countDocuments(q);
        res.json({ success: true, movies, total });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/movies/search
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json({ success: true, movies: [] });
        const movies = await Movie.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { genre: { $in: [new RegExp(q, 'i')] } },
                { 'cast.name': { $regex: q, $options: 'i' } }
            ]
        }).limit(8).select('title poster bg accent rating genre lang _id');
        res.json({ success: true, movies });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/movies/seats/:movieId/:showKey
router.get('/seats/:movieId/:showKey', async (req, res) => {
    try {
        const { movieId, showKey } = req.params;
        const decoded = decodeURIComponent(showKey);
        const [cinema, time, date] = decoded.split('|||');
        const bookings = await Booking.find({ movieId, cinema, time, date, status: { $ne: 'cancelled' } });
        const bookedSeats = bookings.flatMap(b => b.seats);
        res.json({ success: true, bookedSeats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
        movie.views = (movie.views || 0) + 1;
        await movie.save();
        res.json({ success: true, movie });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/movies — Admin only
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const movie = await Movie.create(req.body);
        res.status(201).json({ success: true, movie });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;