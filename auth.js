const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bible_app'
};

// Auth middleware - verifies JWT token and attaches user to request
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    // Support both token payload formats: { id } and legacy OAuth { userId }
    if (decoded && !decoded.id && decoded.userId) {
      decoded.id = decoded.userId;
    }
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Failed to authenticate token.' });
  }
};

// Admin middleware - allows only admin users
const admin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    // Guest tokens should never pass admin checks.
    if (req.user.id === 'guest') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT role FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    await connection.end();

    if (rows.length > 0 && rows[0].role === 'admin') {
      return next();
    }

    return res.status(403).json({ error: 'Access denied. Admin only.' });
  } catch (error) {
    console.error('Admin auth check failed:', error);
    return res.status(500).json({ error: 'Failed to verify admin access.' });
  }
};

// Optional auth - attaches user if token is present, but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && !decoded.id && decoded.userId) {
        decoded.id = decoded.userId;
      }
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without attaching user
    next();
  }
};

module.exports = { auth, admin, optionalAuth };
