const express = require('express');
const router = express.Router();
const { getQuery } = require('../config/db');

// Route to host HTML files
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // 1. Fetch file from SQLite database
    const fileData = await getQuery('SELECT * FROM files WHERE id = ?', [fileId]);
    
    if (!fileData) {
      return res.status(404).send('<h1>404 Not Found</h1><p>The requested file does not exist.</p>');
    }

    // Allow HTML, CSS, and JS files
    const allowedTypes = ['text/html', 'text/css', 'text/javascript', 'application/javascript'];
    if (!allowedTypes.includes(fileData.fileType) && !fileData.fileName.endsWith('.html') && !fileData.fileName.endsWith('.css') && !fileData.fileName.endsWith('.js')) {
      return res.status(400).send('<h1>400 Bad Request</h1><p>This file type cannot be hosted.</p>');
    }

    const base64Data = fileData.data;

    if (!base64Data) {
      return res.status(404).send('<h1>404 Not Found</h1><p>File content is missing or corrupted.</p>');
    }

    // 3. Decode Base64 to string
    // The Base64 string will look like "data:text/html;base64,PCFET0..."
    const base64String = base64Data.split(',')[1];
    
    if (!base64String) {
      return res.status(500).send('<h1>500 Internal Error</h1><p>Failed to parse file data.</p>');
    }

    const decodedHtml = Buffer.from(base64String, 'base64').toString('utf-8');

    // 4. Send with dynamic Content-Type
    let contentType = 'text/html';
    if (fileData.fileName.endsWith('.css') || fileData.fileType === 'text/css') {
      contentType = 'text/css';
    } else if (fileData.fileName.endsWith('.js') || fileData.fileType.includes('javascript')) {
      contentType = 'application/javascript';
    }

    res.setHeader('Content-Type', contentType);
    res.send(decodedHtml);

  } catch (error) {
    console.error('Hosting Error:', error);
    res.status(500).send('<h1>500 Internal Error</h1><p>Failed to load the hosted page.</p>');
  }
});

module.exports = router;
