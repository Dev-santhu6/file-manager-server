const express = require('express');
const router = express.Router();
const multer = require('multer');
const { loginUser, uploadFileAndDetails } = require('../Controller/uploadfilescontroler.js'); // Adjust the path to your controller file

// Set up Multer for file uploads
const upload = multer();

// Login Route
router.post('/login', loginUser);

// Upload Files and Details Route
router.post('/upload', upload.array('files'), uploadFileAndDetails);

// Export the router
module.exports = router;
