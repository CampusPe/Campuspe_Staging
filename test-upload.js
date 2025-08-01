// Simple resume upload test
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/test-upload', upload.single('resume'), (req, res) => {
  console.log('Test upload received:', {
    filename: req.file?.filename,
    size: req.file?.size,
    mimetype: req.file?.mimetype
  });
  
  res.json({
    success: true,
    message: 'File uploaded successfully',
    file: req.file
  });
});

app.listen(5002, () => {
  console.log('Test server running on port 5002');
});
