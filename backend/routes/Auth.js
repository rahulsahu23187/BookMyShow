const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/Auth');

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/signup
router.post('/signup', async(req, res) => {
    try {
        const { name, email, password, phone, city } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        if (password.length < 6)
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

        const exists = await User.findOne({ email });
        if (exists)
            return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });

        const user = await User.create({ name, email, password, phone: phone || '', city: city || 'Mumbai' });
        const token = genToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: { id: user._id, name: user.name, email: user.email, city: user.city, loyaltyPoints: 0 }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async(req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email and password are required' });

        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password)))
            return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const token = genToken(user._id);
        res.json({
            success: true,
            message: `Welcome back, ${user.name.split(' ')[0]}!`,
            token,
            user: { id: user._id, name: user.name, email: user.email, city: user.city, loyaltyPoints: user.loyaltyPoints, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/auth/me
router.get('/me', protect, async(req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/auth/update
router.put('/update', protect, async(req, res) => {
    try {
        const { name, phone, city } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id, { name, phone, city }, { new: true }).select('-password');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/auth/wishlist/:movieId
router.post('/wishlist/:movieId', protect, async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const mid = req.params.movieId;
        const idx = user.wishlist.findIndex(id => id.toString() === mid);
        if (idx === -1) { user.wishlist.push(mid); } else { user.wishlist.splice(idx, 1); }
        await user.save();
        res.json({ success: true, added: idx === -1, wishlist: user.wishlist });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;