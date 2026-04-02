const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

router.get('/', async(req, res) => {
    try {
        const { category, city } = req.query;
        const q = {};
        if (category) q.category = category;
        if (city) q.city = { $regex: city, $options: 'i' };
        const events = await Event.find(q).sort({ createdAt: -1 });
        res.json({ success: true, events });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/:id', async(req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, event });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;