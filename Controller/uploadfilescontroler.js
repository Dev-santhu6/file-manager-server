const { google } = require('googleapis');
const { PassThrough } = require('stream');
const jwt = require('jsonwebtoken');
const drive = google.drive('v3');
const asynchandler = require('express-async-handler');
const generateToken = require('../utils/generateToken.js');
const {User} = require('../Schema/userschema.js');


// Function to create or find a folder in Google Drive
async function findOrCreateFolder(folderName, parentFolderId) {
  const response = await drive.files.list({
    q: `'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  } else {
    return await createFolder(folderName, parentFolderId);
  }
}

// Function to create a new folder in Google Drive
async function createFolder(folderName, parentFolderId) {
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId],
  };

  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });

  return folder.data.id;
}

// Convert buffer to stream for file upload
function bufferToStream(buffer) {
  const stream = new PassThrough();
  stream.end(buffer);
  return stream;
}

// Function to upload multiple files to a specified folder
async function uploadMultipleFiles(files, folderId) {
  const uploadedFiles = [];

  for (const file of files) {
    const fileMetadata = {
      name: file.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: bufferToStream(file.buffer), // Convert buffer to stream
    };

    try {
      const driveResponse = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, webViewLink, webContentLink',
      });

      uploadedFiles.push({
        id: driveResponse.data.id,
        name: driveResponse.data.name,
        mimeType: driveResponse.data.mimeType,
        webViewLink: driveResponse.data.webViewLink,
        webContentLink: driveResponse.data.webContentLink,
      });
    } catch (error) {
      console.error(`Error uploading file ${file.originalname}:`, error.message);
      throw error;
    }
  }

  return uploadedFiles;
}

// User login controller


            


exports.loginUser = asynchandler(async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (name && user.name !== name) {
                res.status(401);
                throw new Error('Name does not match');
            }

            const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
                expiresIn: '1h',
            });

            res.cookie('jwt', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600000, // 1 hour
            });

            const CLIENT_ID = '142217289656-h0md160b593d5usfqqlnj62v1tibrh4v.apps.googleusercontent.com';
            const CLIENT_SECRET = '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';
            const REFRESH_TOKEN = '1//04qECG7Dn8aktCgYIARAAGAQSNwF-L9IrQrRCJ11gHMlzkBDkBosYUBDbzhEn2hUGDezOu0L5eNlxFOJeEHQmlGpW1Y8U1igxf5k';
            const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
            auth.setCredentials({ refresh_token: REFRESH_TOKEN });
            google.options({ auth });

            const parentFolderId = 'your-parent-folder-id';

            const userFolderId = await findOrCreateFolder(user.username, parentFolderId);

            res.status(200).json({
                id: user.id,
                name: user.name,
                email: user.email,
                token: res.cookie('jwt').value,
                folderId: userFolderId,
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// exports.login = async (req, res) => {
//     try {
//       const { email, password } = req.body;
  
//       // Find the user in your database (this is just a placeholder)
//       const user = await User.findOne({ email });
  
//       if (!user || !(await user.isPasswordValid(password))) {
//         return res.status(401).json({ message: 'Invalid email or password' });
//       }
  
//       // Generate JWT token
//       const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
//         expiresIn: '1h',
//       });
//       const CLIENT_ID = '142217289656-h0md160b593d5usfqqlnj62v1tibrh4v.apps.googleusercontent.com'; // Replace with your Client ID
//       const CLIENT_SECRET = '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'; // Replace with your Client Secret
//       const REDIRECT_URI = 'https://developers.google.com/oauthplayground'; // Replace with your Redirect URI
//       const REFRESH_TOKEN = '1//04qECG7Dn8aktCgYIARAAGAQSNwF-L9IrQrRCJ11gHMlzkBDkBosYUBDbzhEn2hUGDezOu0L5eNlxFOJeEHQmlGpW1Y8U1igxf5k';
//       // Google Drive authentication
//       const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
//       auth.setCredentials({ refresh_token: REFRESH_TOKEN });
//       google.options({ auth });
  
//       // Parent folder ID (root or specific parent folder)
//       const parentFolderId = '1tGjqpHz5CpF5UNMzBuzWb6gZKl3Fr6TZ';
  
//       // Create or find the user's folder with their username
//       const userFolderId = await findOrCreateFolder(user.username, parentFolderId);
  
//       return res.status(200).json({
//         message: 'Login successful',
//         token,
//         user: {
//           id: user._id,
//           email: user.email,
//           username: user.username,
//           folderId: userFolderId,
//         },
//       });
//     } catch (error) {
//       console.error('Login error:', error);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   };
// Upload files controller
exports.uploadFileAndDetails = async (req, res) => {
  const { name, description, location, material, date, vehicleNumber, teamMembers, startMeterReading, endMeterReading } = req.body;
  const files = req.files;

  if (!files || !name || !location || !material || !date || !vehicleNumber || !teamMembers || !startMeterReading || !endMeterReading) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  let parsedMaterial;
  try {
    parsedMaterial = JSON.parse(material);
    if (!Array.isArray(parsedMaterial)) {
      throw new Error('Material must be an array');
    }
  } catch (err) {
    return res.status(400).json({ message: 'Material details are incorrectly formatted' });
  }

  try {
    // Retrieve the username from headers and the corresponding user folder ID
    const userName = req.headers['x-username'];
    const userFolderId = await findOrCreateFolder(userName, '1tGjqpHz5CpF5UNMzBuzWb6gZKl3Fr6TZ');

    // Create a subfolder with the project name inside the user's folder
    const newFolderId = await createFolder(name, userFolderId);

    // Upload multiple files to the newly created folder
    const uploadedFiles = await uploadMultipleFiles(files, newFolderId);

    const materialTable = generateMaterialTable(parsedMaterial);

    const total = endMeterReading - startMeterReading;

    const detailsFileName = `details of ${name}.txt`;
    const detailsContent = `
      Name: ${name}
      Description: ${description}
      Location: ${location}
      Materials:
      ${materialTable}
      
      Schedule:
      Date: ${date}
      Vehicle Number: ${vehicleNumber}
      Team Members:
      ${teamMembers.map(member => `- ${member}`).join('\n')}
      Start Meter Reading: ${startMeterReading}
      End Meter Reading: ${endMeterReading}
      Total: ${total}
      Created by: ${userName}
    `.trim();

    const detailsFile = await drive.files.create({
      requestBody: {
        name: detailsFileName,
        mimeType: 'text/plain',
        parents: [newFolderId],
      },
      media: {
        mimeType: 'text/plain',
        body: bufferToStream(Buffer.from(detailsContent)),  // Convert text to stream
      },
    });

    res.json({
      message: 'Files, details, schedule, and material information uploaded successfully!',
      folderId: newFolderId,
      uploadedFiles,
      detailsFileId: detailsFile.data.id,
    });
  } catch (error) {
    console.error('Error uploading files:', error.message);
    res.status(500).json({ message: 'Failed to upload files, details, schedule, and material information', error: error.message });
  }
};

// Function to generate material table
function generateMaterialTable(parsedMaterial) {
  const calculateMaxWidths = (materials) => {
    const widths = {
      mainType: 'Main Type'.length,
      subTypes: 'Sub Types'.length,
      whyChoose: 'Model'.length,
      model: 'Quantity'.length,
    };

    materials.forEach(m => {
      widths.mainType = Math.max(widths.mainType, m.mainType.length);
      widths.subTypes = Math.max(widths.subTypes, Array.isArray(m.subTypes) ? m.subTypes.join('; ').length : 0);
      widths.whyChoose = Math.max(widths.whyChoose, m.whyChoose.length);
      widths.model = Math.max(widths.model, m.model.length);
    });

    return widths;
  };

  const padToWidth = (text, width) => text.padEnd(width, ' ');

  const widths = calculateMaxWidths(parsedMaterial);

  const tableHeader = `| ${padToWidth('Main Type', widths.mainType)} | ${padToWidth('Sub Types', widths.subTypes)} | ${padToWidth('Model', widths.whyChoose)} | ${padToWidth('Quantity', widths.model)} |`;
  const tableSeparator = `|${'-'.repeat(widths.mainType + 2)}|${'-'.repeat(widths.subTypes + 2)}|${'-'.repeat(widths.whyChoose + 2)}|${'-'.repeat(widths.model + 2)}|`;

  const tableRows = parsedMaterial.map(m =>
    `| ${padToWidth(m.mainType, widths.mainType)} | ${padToWidth(Array.isArray(m.subTypes) ? m.subTypes.join('; ') : '', widths.subTypes)} | ${padToWidth(m.whyChoose, widths.whyChoose)} | ${padToWidth(m.model, widths.model)} |`
  ).join('\n');

  return `${tableHeader}\n${tableSeparator}\n${tableRows}`;
}
