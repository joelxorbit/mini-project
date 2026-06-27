const express = require('express');
const router = express.Router();
const { rtdb, db } = require('../config/firebase');

// Route to access publicly shared files
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // 1. Fetch metadata
    const fileDoc = await db.collection('Files').doc(fileId).get();
    
    if (!fileDoc.exists) {
      return res.status(404).send('<h1>404 Not Found</h1><p>The requested file does not exist.</p>');
    }

    const fileData = fileDoc.data();

    // 2. Security Check: Ensure file is public
    if (fileData.isPublic !== true) {
      return res.status(403).send('<h1>403 Forbidden</h1><p>This file is private and has not been shared.</p>');
    }

    // 3. Fetch Base64 data from Realtime Database
    const snapshot = await rtdb.ref(`fileBlobs/${fileId}/data`).once('value');
    const base64Data = snapshot.val();

    if (!base64Data) {
      return res.status(404).send('<h1>404 Not Found</h1><p>File content is missing or corrupted.</p>');
    }

    // 4. Decode Base64
    const base64Parts = base64Data.split(',');
    const base64String = base64Parts[1];
    
    if (!base64String) {
      return res.status(500).send('<h1>500 Internal Error</h1><p>Failed to parse file data.</p>');
    }

    const fileBuffer = Buffer.from(base64String, 'base64');

    // 5. Send with dynamic Content-Type
    let contentType = fileData.fileType || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    // If you want it to download by default instead of viewing in browser:
    // res.setHeader('Content-Disposition', `attachment; filename="${fileData.fileName}"`);
    
    // For images, videos, audio, and pdfs, it's better to view in browser. 
    // We will use inline disposition.
    res.setHeader('Content-Disposition', `inline; filename="${fileData.fileName}"`);
    
    res.send(fileBuffer);

  } catch (error) {
    console.error('Share Route Error:', error);
    res.status(500).send('<h1>500 Internal Error</h1><p>Failed to load the shared file.</p>');
  }
});

module.exports = router;
