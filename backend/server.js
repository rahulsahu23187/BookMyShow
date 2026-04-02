require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// DB connect
connectDB();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'BookMyShow backend is running'
  });
});

// API routes
app.use('/api/auth', require('./routes/Auth'));
app.use('/api/movies', require('./routes/movie'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/events', require('./routes/events'));

// Static frontend serve
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Direct page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/movie.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'movie.html'));
});

app.get('/booking.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'booking.html'));
});

app.get('/ticket.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'ticket.html'));
});

app.get('/events.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'events.html'));
});

app.get('/event-booking.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'event-booking.html'));
});

app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'profile.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'signup.html'));
});

app.get('/search.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'search.html'));
});

app.get('/payment.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'payment.html'));
});

// Unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

// Frontend fallback
app.get('*', (req, res) => {
  if (path.extname(req.path)) {
    return res.status(404).send('File not found');
  }

  return res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
