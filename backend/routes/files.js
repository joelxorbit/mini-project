const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getQuery, allQuery, runQuery } = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get all files belonging to user (metadata only, excluding large data blob)
router.get('/', verifyToken, async (req, res) => {
  try {
    const rows = await allQuery(
      `SELECT id, owner, fileName, fileType, fileSize, uploadDate, isPublic, downloadCount 
       FROM files 
       WHERE owner = ? 
       ORDER BY uploadDate DESC`,
      [req.user.uid]
    );

    const files = rows.map(f => ({
      ...f,
      isPublic: Boolean(f.isPublic)
    }));

    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Upload a new file
router.post('/', verifyToken, async (req, res) => {
  try {
    const { fileName, fileType, fileSize, data } = req.body;

    if (!fileName || !data) {
      return res.status(400).json({ error: 'Missing required file data' });
    }

    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const uploadDate = new Date().toISOString();

    await runQuery(
      `INSERT INTO files (id, owner, fileName, fileType, fileSize, uploadDate, isPublic, downloadCount, data)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)`,
      [id, req.user.uid, fileName, fileType || 'application/octet-stream', fileSize || 0, uploadDate, data]
    );

    // Update user storageUsed
    await runQuery(
      `UPDATE users SET storageUsed = storageUsed + ? WHERE uid = ?`,
      [fileSize || 0, req.user.uid]
    );

    res.status(201).json({
      id,
      owner: req.user.uid,
      fileName,
      fileType,
      fileSize,
      uploadDate,
      isPublic: false,
      downloadCount: 0
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download a file (returns base64 data and increments downloadCount)
router.get('/:id/download', verifyToken, async (req, res) => {
  try {
    const file = await getQuery(
      `SELECT data, fileName FROM files WHERE id = ?`,
      [req.params.id]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    await runQuery(
      `UPDATE files SET downloadCount = downloadCount + 1 WHERE id = ?`,
      [req.params.id]
    );

    res.json({ data: file.data, fileName: file.fileName });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Update share status of a file
router.patch('/:id/share', verifyToken, async (req, res) => {
  try {
    const { isPublic } = req.body;

    await runQuery(
      `UPDATE files SET isPublic = ? WHERE id = ? AND owner = ?`,
      [isPublic ? 1 : 0, req.params.id, req.user.uid]
    );

    res.json({ success: true, isPublic: Boolean(isPublic) });
  } catch (error) {
    console.error('Error updating share settings:', error);
    res.status(500).json({ error: 'Failed to update share settings' });
  }
});

// Delete a file
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const file = await getQuery(
      `SELECT fileSize, owner FROM files WHERE id = ? AND owner = ?`,
      [req.params.id, req.user.uid]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }

    await runQuery(`DELETE FROM files WHERE id = ? AND owner = ?`, [req.params.id, req.user.uid]);

    await runQuery(
      `UPDATE users SET storageUsed = MAX(0, storageUsed - ?) WHERE uid = ?`,
      [file.fileSize || 0, req.user.uid]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
