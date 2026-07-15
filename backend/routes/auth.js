const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getQuery, runQuery } = require('../config/db');
const { verifyToken, JWT_SECRET } = require('../middleware/authMiddleware');

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, username, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if email already exists
    const existingUser = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const joinedDate = new Date().toISOString();

    await runQuery(
      `INSERT INTO users (uid, fullName, username, email, password, phone, storageUsed, storageLimit, plan, isPremium, joinedDate, role)
       VALUES (?, ?, ?, ?, ?, ?, 0, 10485760, 'Free', 0, ?, 'user')`,
      [
        uid,
        fullName || 'User',
        username || email.split('@')[0],
        email,
        hashedPassword,
        phone || '',
        joinedDate
      ]
    );

    const user = await getQuery('SELECT * FROM users WHERE uid = ?', [uid]);
    delete user.password;

    const token = jwt.sign({ uid: user.uid, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        ...user,
        isPremium: Boolean(user.isPremium)
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    delete user.password;
    const token = jwt.sign({ uid: user.uid, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        ...user,
        isPremium: Boolean(user.isPremium)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current logged in user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await getQuery('SELECT * FROM users WHERE uid = ?', [req.user.uid]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    delete user.password;
    res.json({
      ...user,
      isPremium: Boolean(user.isPremium)
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
