const express = require('express');
const mysql = require('mysql2/promise');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bible_app'
};

// Helper function to get database connection
const getConnection = async () => {
  return await mysql.createConnection(dbConfig);
};

// Admin dashboard - get statistics
router.get('/dashboard', auth, admin, async (req, res) => {
  try {
    const connection = await getConnection();

    // Get user count (excluding admins)
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role != ?', ['admin']);
    
    // Get saved verses count
    const [savedVersesCount] = await connection.execute('SELECT COUNT(*) as count FROM saved_verses');
    
    // Get recent users (excluding admins)
    const [recentUsers] = await connection.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE role != ? ORDER BY created_at DESC LIMIT 10',
      ['admin']
    );
    
    // Get recent saved verses
    const [recentVerses] = await connection.execute(
      `SELECT sv.id, sv.book, sv.chapter, sv.verse_number, sv.note, sv.created_at, u.name as user_name 
       FROM saved_verses sv 
       JOIN users u ON sv.user_id = u.id 
       ORDER BY sv.created_at DESC LIMIT 10`
    );

    await connection.end();

    res.json({
      statistics: {
        totalUsers: userCount[0].count,
        totalSavedVerses: savedVersesCount[0].count
      },
      recentUsers,
      recentVerses
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all users
router.get('/users', auth, admin, async (req, res) => {
  try {
    const connection = await getConnection();

    const [users] = await connection.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE role != ? ORDER BY created_at DESC',
      ['admin']
    );

    await connection.end();

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role
router.put('/users/:id/role', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const connection = await getConnection();

    await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    await connection.end();

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user
router.delete('/users/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const connection = await getConnection();

    await connection.execute('DELETE FROM users WHERE id = ?', [id]);

    await connection.end();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all saved verses
router.get('/saved-verses', auth, admin, async (req, res) => {
  try {
    const connection = await getConnection();

    const [verses] = await connection.execute(
      `SELECT sv.id, sv.book, sv.chapter, sv.verse_number, sv.verse_text, sv.note, sv.created_at, 
       u.name as user_name, u.email as user_email 
       FROM saved_verses sv 
       JOIN users u ON sv.user_id = u.id 
       ORDER BY sv.created_at DESC`
    );

    await connection.end();

    res.json({ saved_verses: verses });
  } catch (error) {
    console.error('Get saved verses error:', error);
    res.status(500).json({ error: 'Failed to fetch saved verses' });
  }
});

module.exports = router;
