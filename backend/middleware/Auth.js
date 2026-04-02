// middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization || '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('protect middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in auth middleware'
    });
  }
};

const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Admin only'
    });
  } catch (error) {
    console.error('adminOnly middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in admin auth'
    });
  }
};

module.exports = { protect, adminOnly };