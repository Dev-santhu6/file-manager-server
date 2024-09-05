

const express = require('express');
const multer = require('multer');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
// const protect = require('../middleware/authMiddleware');



const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});
const router = express.Router();
const {
  uploadFileAndDetails,
  getFolderAndDetailsByName,
  deleteFolderByName,
  updateFolderDetails,
    loginUser,
    getUserFolders
  // getProfile


} = require('../Controller/uploadcontroller.js');



// Route to handle file, details, and material upload
router.post('/upload', upload.array('files', 10), uploadFileAndDetails);

// Route to retrieve folder, details, and material information by name
router.get('/get/:folderName', getFolderAndDetailsByName); // /:folderName

// Route to delete folder by name
router.delete('/delete/:folderName', deleteFolderByName);

// Route to update folder name, details, and material information
router.put('/update/:folderName', upload.array('files', 10),updateFolderDetails);
// router.post('/update/:folderName', upload.array('files',10), updateFolderDetails);

// Route to fetch the user's folders
router.get('/getfolder/:folderName', getUserFolders);

// router.get('/profile', getProfile);
router.post('/login', loginUser);     

// router.post('/update-folder-status',updateFolderStatus);


module.exports = router;






