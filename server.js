// // const express = require('express');
// // const multer = require('multer');
// // const { google } = require('googleapis');
// // const stream = require('stream');
// // const cors = require('cors');

// // const app = express();
// // const PORT = process.env.PORT || 3001;

// // // Enable CORS
// // app.use(cors());

// // // Google OAuth2 setup
// // const CLIENT_ID = '142217289656-r25t5bt7712hj4eu4up5q8rpi9h2tr64.apps.googleusercontent.com'; // Replace with your Client ID
// // const CLIENT_SECRET = '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'; // Replace with your Client Secret
// // const REDIRECT_URI = 'https://developers.google.com/oauthplayground'; // Replace with your Redirect URI
// // const REFRESH_TOKEN = '1//04P5d4gTSpGYgCgYIARAAGAQSNwF-L9IrSzwJQsfed45kY45k732lRz9UrJGHI_mUaxbEn9h1NFwqv5OL9jrc8oFiXkRVfBvnsM4';

// // const oauth2Client = new google.auth.OAuth2(
// //   CLIENT_ID,
// //   CLIENT_SECRET,
// //   REDIRECT_URI
// // );

// // oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// // const drive = google.drive({ version: 'v3', auth: oauth2Client });

// // // Set up multer storage engine
// // const storage = multer.memoryStorage();
// // const upload = multer({ storage: storage });

// // // Function to convert buffer to readable stream
// // function bufferToStream(buffer) {
// //   const readable = new stream.PassThrough();
// //   readable.end(buffer);
// //   return readable;
// // }

// // // Endpoint to handle file upload and details submission
// // app.post('/upload', upload.single('file'), async (req, res) => {
// //   const { name, description } = req.body;
// //   const file = req.file;

// //   if (!file || !name) {
// //     return res.status(400).json({ message: 'File and name are required' });
// //   }

// //   try {
// //     // Convert the buffer to a readable stream
// //     const bufferStream = bufferToStream(file.buffer);

// //     // Upload the file to Google Drive
// //     const response = await drive.files.create({
// //       requestBody: {
// //         name: file.originalname,
// //         mimeType: file.mimetype,
// //       },
// //       media: {
// //         mimeType: file.mimetype,
// //         body: bufferStream,
// //       },
// //     });

// //     // Update the file with additional metadata (name and description)
// //     await drive.files.update({
// //       fileId: response.data.id,
// //       requestBody: {
// //         description: `Name: ${name}, Description: ${description}`,
// //       },
// //     });

// //     res.json({
// //       message: 'File uploaded successfully!',
// //       fileId: response.data.id,
// //     });
// //   } catch (error) {
// //     console.error('Error uploading file:', error.response ? error.response.data : error.message);
// //     res.status(500).json({ message: 'Failed to upload file', error: error.message });
// //   }
// // });

// // app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// //https://drive.google.com/drive/folders/1tGjqpHz5CpF5UNMzBuzWb6gZKl3Fr6TZ?usp=drive_link


// // const express = require('express');
// // const multer = require('multer');
// // const { google } = require('googleapis');
// // const stream = require('stream');
// // const cors = require('cors');

// // const app = express();
// // const PORT = process.env.PORT || 3001;

// // // Enable CORS
// // app.use(cors());

// // // Google OAuth2 setup
// // const CLIENT_ID = '142217289656-r25t5bt7712hj4eu4up5q8rpi9h2tr64.apps.googleusercontent.com'; // Replace with your Client ID
// // const CLIENT_SECRET = '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'; // Replace with your Client Secret
// // const REDIRECT_URI = 'https://developers.google.com/oauthplayground'; // Replace with your Redirect URI
// // const REFRESH_TOKEN = '1//04P5d4gTSpGYgCgYIARAAGAQSNwF-L9IrSzwJQsfed45kY45k732lRz9UrJGHI_mUaxbEn9h1NFwqv5OL9jrc8oFiXkRVfBvnsM4';

// // const oauth2Client = new google.auth.OAuth2(
// //   CLIENT_ID,
// //   CLIENT_SECRET,
// //   REDIRECT_URI
// // );

// // oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// // const drive = google.drive({ version: 'v3', auth: oauth2Client });

// // // Set up multer storage engine
// // const storage = multer.memoryStorage();
// // const upload = multer({ storage: storage });

// // // Function to convert buffer to readable stream
// // function bufferToStream(buffer) {
// //   const readable = new stream.PassThrough();
// //   readable.end(buffer);
// //   return readable;
// // }

// // // Endpoint to handle file upload and details submission
// // app.post('/upload', upload.single('file'), async (req, res) => {
// //   const { name, description } = req.body;
// //   const file = req.file;

// //   if (!file || !name) {
// //     return res.status(400).json({ message: 'File and name are required' });
// //   }

// //   try {
// //     // Specify the folder ID where you want to store the file
// //     const folderId = '1tGjqpHz5CpF5UNMzBuzWb6gZKl3Fr6TZ'; // Replace with the actual folder ID from Google Drive

// //     // Convert the buffer to a readable stream
// //     const bufferStream = bufferToStream(file.buffer);

// //     // Upload the file to Google Drive
// //     const response = await drive.files.create({
// //       requestBody: {
// //         name: file.originalname,
// //         mimeType: file.mimetype,
// //         parents: [folderId], // Specify the folder ID here
// //       },
// //       media: {
// //         mimeType: file.mimetype,
// //         body: bufferStream,
// //       },
// //     });

// //     // Update the file with additional metadata (name and description)
// //     await drive.files.update({
// //       fileId: response.data.id,
// //       requestBody: {
// //         description: `Name: ${name}, Description: ${description}`,
// //       },
// //     });

// //     res.json({
// //       message: 'File uploaded successfully!',
// //       fileId: response.data.id,
// //     });
// //   } catch (error) {
// //     console.error('Error uploading file:', error.response ? error.response.data : error.message);
// //     res.status(500).json({ message: 'Failed to upload file', error: error.message });
// //   }
// // });

// // app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// const express = require('express');
// const multer = require('multer');
// const { google } = require('googleapis');
// const stream = require('stream');
// const cors = require('cors');

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Enable CORS
// app.use(cors());

// // Google OAuth2 setup
// const CLIENT_ID = '142217289656-r25t5bt7712hj4eu4up5q8rpi9h2tr64.apps.googleusercontent.com'; // Replace with your Client ID
// const CLIENT_SECRET = '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'; // Replace with your Client Secret
// const REDIRECT_URI = 'https://developers.google.com/oauthplayground'; // Replace with your Redirect URI
// const REFRESH_TOKEN = '1//04P5d4gTSpGYgCgYIARAAGAQSNwF-L9IrSzwJQsfed45kY45k732lRz9UrJGHI_mUaxbEn9h1NFwqv5OL9jrc8oFiXkRVfBvnsM4';

// const oauth2Client = new google.auth.OAuth2(
//   CLIENT_ID,
//   CLIENT_SECRET,
//   REDIRECT_URI
// );

// oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// const drive = google.drive({ version: 'v3', auth: oauth2Client });

// // Set up multer storage engine
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// // Function to convert buffer to readable stream
// function bufferToStream(buffer) {
//   const readable = new stream.PassThrough();
//   readable.end(buffer);
//   return readable;
// }

// // Function to create a new folder
// async function createFolder(folderName, parentFolderId) {
//   const fileMetadata = {
//     name: folderName,
//     mimeType: 'application/vnd.google-apps.folder',
//     parents: [parentFolderId],
//   };

//   const folder = await drive.files.create({
//     resource: fileMetadata,
//     fields: 'id',
//   });

//   return folder.data.id;
// }

// // Endpoint to handle file upload and details submission
// app.post('/upload', upload.single('file'), async (req, res) => {
//   const { name, description } = req.body;
//   const file = req.file;

//   if (!file || !name) {
//     return res.status(400).json({ message: 'File and name are required' });
//   }

//   try {
//     // Specify the parent folder ID where you want to create the new folder
//     const parentFolderId = '1tGjqpHz5CpF5UNMzBuzWb6gZKl3Fr6TZ'; // Replace with the actual parent folder ID from Google Drive

//     // Create a new folder with the provided name inside the parent folder
//     const newFolderId = await createFolder(name, parentFolderId);

//     // Convert the buffer to a readable stream
//     const bufferStream = bufferToStream(file.buffer);

//     // Upload the file to the newly created folder in Google Drive
//     const response = await drive.files.create({
//       requestBody: {
//         name: file.originalname,
//         mimeType: file.mimetype,
//         parents: [newFolderId], // Specify the new folder ID here
//       },
//       media: {
//         mimeType: file.mimetype,
//         body: bufferStream,
//       },
//     });

//     // Optionally, you can create a text file to store the details (name and description)
//     const detailsFile = await drive.files.create({
//       requestBody: {
//         name: 'details.txt',
//         mimeType: 'text/plain',
//         parents: [newFolderId],
//       },
//       media: {
//         mimeType: 'text/plain',
//         body: `Name: ${name}\nDescription: ${description}`,
//       },
//     });

//     res.json({
//       message: 'File and details uploaded successfully!',
//       fileId: response.data.id,
//       detailsFileId: detailsFile.data.id,
//     });
//   } catch (error) {
//     console.error('Error uploading file:', error.response ? error.response.data : error.message);
//     res.status(500).json({ message: 'Failed to upload file', error: error.message });
//   }
// });

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// server.js
const express = require('express');
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js');
const cookieParser = require('cookie-parser');
const {dbConnect} = require('./utils/dbConnect.js');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const uploadRoutes = require('./Routes/uploadroutes.js');
const userRoutes = require("./Routes/userroutes.js")
// const uploadedFiles = require("./Routes/uploadfileroute.js")

require('dotenv').config();

const app = express();

const port = process.env.PORT || 3001;

dbConnect()
// Enable CORS
app.use(cors({
  origin: 'http://ecosteem-s3.s3-website-us-east-1.amazonaws.com',
  credentials: true,
}));

app.use(bodyParser.json());

app.use(express.json());
app.use(express.urlencoded( {extended: true }))
app.use(cookieParser())

// Use the upload routes
app.use('/api', uploadRoutes);
app.use('/api/user', userRoutes);

// app.use('/api/use', uploadedFiles);



function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  }
  
  app.get('/protected', authenticateToken, (req, res) => {
    res.send(`Hello ${req.user.username}, you are authorized`);
  });
// Start the server
app.get("/",(req,res) => res.send("server is ready"));

app.use(notFound)
app.use(errorHandler)

app.listen(port, () => {
    console.log(`Server Started at ${port}`)
}) 





