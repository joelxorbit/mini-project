const express = require('express');
const router = express.Router();
const { getQuery, runQuery } = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await getQuery('SELECT * FROM users WHERE uid = ?', [req.user.uid]);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    // Convert isPremium to boolean
    res.json({
      ...user,
      isPremium: Boolean(user.isPremium)
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Create or update user profile
router.post('/profile', verifyToken, async (req, res) => {
  try {
    const { fullName, username, email, phone, storageUsed, storageLimit, plan, isPremium, joinedDate, role } = req.body;

    const existing = await getQuery('SELECT * FROM users WHERE uid = ?', [req.user.uid]);

    if (existing) {
      await runQuery(
        `UPDATE users SET
          fullName = COALESCE(?, fullName),
          username = COALESCE(?, username),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone)
        WHERE uid = ?`,
        [fullName, username, email, phone, req.user.uid]
      );
      const updated = await getQuery('SELECT * FROM users WHERE uid = ?', [req.user.uid]);
      return res.json({ ...updated, isPremium: Boolean(updated.isPremium) });
    } else {
      await runQuery(
        `INSERT INTO users (uid, fullName, username, email, phone, storageUsed, storageLimit, plan, isPremium, joinedDate, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.uid,
          fullName || 'User',
          username || (email ? email.split('@')[0] : 'user'),
          email || req.user.email || '',
          phone || '',
          storageUsed || 0,
          storageLimit || 10 * 1024 * 1024,
          plan || 'Free',
          isPremium ? 1 : 0,
          joinedDate || new Date().toISOString(),
          role || 'user'
        ]
      );
      const created = await getQuery('SELECT * FROM users WHERE uid = ?', [req.user.uid]);
      return res.status(201).json({ ...created, isPremium: Boolean(created.isPremium) });
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
    res.status(500).json({ error: 'Failed to save user profile' });
  }
});

module.exports = router;
