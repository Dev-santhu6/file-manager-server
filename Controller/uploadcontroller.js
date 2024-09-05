const asynchandler = require('express-async-handler');
const User = require('../Schema/userschema.js');
const { google } = require('googleapis');
const generateToken = require('../utils/generateToken.js');

const stream = require('stream');
const cookies = require('js-cookie');
const { getUserByEmail } = require("../Controller/usercontroller.js")


const CLIENT_ID = '142217289656-h0md160b593d5usfqqlnj62v1tibrh4v.apps.googleusercontent.com'; // Replace with your Client ID
const CLIENT_SECRET = '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'; // Replace with your Client Secret
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'; // Replace with your Redirect URI
const REFRESH_TOKEN = '1//041keHreEJ9QQCgYIARAAGAQSNwF-L9IrzssgfC19F1wKCtWztmpYGoJmE0uriS12JtU5AsU5aPqOGoJ45mvls1HjKuF4UcCcGPM';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });


//upload files ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function findOrCreateFolder(userName, parentFolderId) {
  const response = await drive.files.list({
    q: `'${parentFolderId}' in parents and name='${userName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  } else {
    return await createFolder(userName, parentFolderId);
  }
}

async function createFolder(folderName, userName) {
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [userName],
  };

  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });

  return folder.data.id;
}

const { PassThrough } = require('stream');

function bufferToStream(buffer) {
  const stream = new PassThrough();
  stream.end(buffer);
  return stream;
}

async function uploadMultipleFiles(files, folderId) {
  const uploadedFiles = [];

  for (const file of files) {
    const fileMetadata = {
      name: file.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: bufferToStream(file.buffer),  // Convert buffer to stream
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

const userState = {};

async function loginUser(req, res) {
  const { email, password, name } = req.body;

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (name && user.name !== name) {
      return res.status(401).json({ message: 'Name does not match' });
    }

    generateToken(res, user.id);
    const userName = user.name;

    res.setHeader('x-username', userName);
    res.cookie('userName', userName, {
      path: '/',
      sameSite: 'None',
      secure: true,
    });

    userState.userName = userName;

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      token: res.cookie('jwt').value,
    });

  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ message: error.message });
    }
    console.error('Error in loginUser:', error.message);
  }
}

async function uploadFileAndDetails(req, res) {
  try {
    const userName = userState.userName;
    if (!userName) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

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

    const parentFolderId = '1tGjqpHz5CpF5UNMzBuzWb6gZKl3Fr6TZ';
    const userFolderId = await findOrCreateFolder(userName, parentFolderId);
    const newFolderId = await createFolder(name, userFolderId);
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
        body: bufferToStream(Buffer.from(detailsContent)),
      },
    });

    return res.json({
      message: 'Files, details, schedule, and material information uploaded successfully!',
      folderId: newFolderId,
      uploadedFiles,
      detailsFileId: detailsFile.data.id,
    });

  } catch (error) {
    console.error('Error uploading files:', error.message);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to upload files, details, schedule, and material information', error: error.message });
    }
  }
}


function generateMaterialTable(parsedMaterial) {
  const calculateMaxWidths = (materials) => {
    const widths = {
      mainType: 'Main Type'.length,
      subTypes: 'Sub Types'.length,
      whyChoose: 'Why Choose'.length,
      model: 'Model'.length,
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

  const tableHeader = `| ${padToWidth('Main Type', widths.mainType)} | ${padToWidth('Sub Types', widths.subTypes)} | ${padToWidth('Why Choose', widths.whyChoose)} | ${padToWidth('Model', widths.model)} |`;
  const tableSeparator = `|${'-'.repeat(widths.mainType + 2)}|${'-'.repeat(widths.subTypes + 2)}|${'-'.repeat(widths.whyChoose + 2)}|${'-'.repeat(widths.model + 2)}|`;

  const tableRows = parsedMaterial.map(m =>
    `| ${padToWidth(m.mainType, widths.mainType)} | ${padToWidth(Array.isArray(m.subTypes) ? m.subTypes.join('; ') : '', widths.subTypes)} | ${padToWidth(m.whyChoose, widths.whyChoose)} | ${padToWidth(m.model, widths.model)} |`
  ).join('\n');

  return `${tableHeader}\n${tableSeparator}\n${tableRows}`;
}


// upload file end /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// get details /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// async function getFolderAndDetailsByName(req, res) {
//   const { folderName } = req.params; // Assuming folder name is provided as a URL parameter

//   if (!folderName) {
//     return res.status(400).json({ message: 'Folder name is required' });
//   }

//   try {
//     // Step 1: Find the folder by its name
//     const folderResponse = await drive.files.list({
//       q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
//       fields: 'files(id, name)',
//     });

//     if (folderResponse.data.files.length === 0) {
//       return res.status(404).json({ message: 'Folder not found' });
//     }

//     const folderId = folderResponse.data.files[0].id;

//     // Step 2: Retrieve the details file
//     const detailsFileResponse = await drive.files.list({
//       q: `'${folderId}' in parents and mimeType='text/plain'`,
//       fields: 'files(id, name)',
//     });

//     const detailsFileId = detailsFileResponse.data.files.length > 0 ? detailsFileResponse.data.files[0].id : null;

//     // Step 3: Retrieve images within the folder
//     const imagesResponse = await drive.files.list({
//       q: `'${folderId}' in parents and mimeType contains 'image/'`,
//       fields: 'files(id, name, mimeType)',
//     });

//     const images = imagesResponse.data.files;

//     // Retrieve the details file content if it exists
//     let detailsFileContent = '';
//     if (detailsFileId) {
//       const detailsResponse = await drive.files.get({
//         fileId: detailsFileId,
//         alt: 'media',
//       }, {
//         responseType: 'text',
//       });
//       detailsFileContent = detailsResponse.data;
//     }

//     res.json({
//       folderId,
//       folderName,
//       detailsFileId,
//       detailsFileContent,
//       images,
//     });
//   } catch (error) {
//     console.error('Error retrieving folder details and images:', error.response ? error.response.data : error.message);
//     res.status(500).json({ message: 'Failed to retrieve folder details and images', error: error.message });
//   }
// }




async function findOrCreateFolder(userName, parentFolderId) {
  const response = await drive.files.list({
    q: `'${parentFolderId}' in parents and name='${userName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  } else {
    return await createFolder(userName, parentFolderId);
  }
}

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

async function getFolderAndDetailsByName(req, res) {
  const { folderName } = req.params; // Assuming folder name is provided as a URL parameter
  const userName = userState.userName;

  if (!folderName) {
    return res.status(400).json({ message: 'Folder name is required' });
  }

  try {
    // Step 1: Find the user folder by userName
    const parentFolderId = '1tGjqpHz5CpF5UNMzBuzWb6gZKl3Fr6TZ'; // Define the main parent folder ID
    const userFolderId = await findOrCreateFolder(userName, parentFolderId);

    // Step 2: Find the folder by its name within the user folder
    const folderResponse = await drive.files.list({
      q: `'${userFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    if (folderResponse.data.files.length === 0) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const folderId = folderResponse.data.files[0].id;

    // Step 3: Retrieve the details file within the folder
    const detailsFileResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='text/plain'`,
      fields: 'files(id, name)',
    });

    const detailsFileId = detailsFileResponse.data.files.length > 0 ? detailsFileResponse.data.files[0].id : null;

    // Step 4: Retrieve images within the folder
    const imagesResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/'`,
      fields: 'files(id, name, mimeType)',
    });

    const images = imagesResponse.data.files;

    // Retrieve the details file content if it exists
    let detailsFileContent = '';
    if (detailsFileId) {
      const detailsResponse = await drive.files.get({
        fileId: detailsFileId,
        alt: 'media',
      }, {
        responseType: 'text',
      });
      detailsFileContent = detailsResponse.data;
    }

    res.json({
      folderId,
      folderName,
      detailsFileId,
      detailsFileContent,
      images,
    });
  } catch (error) {
    console.error('Error retrieving folder details and images:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Failed to retrieve folder details and images', error: error.message });
  }
}


// get details end ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function to delete folder by name
async function deleteFolderByName(req, res) {
  const { folderName } = req.params;

  if (!folderName) {
    return res.status(400).json({ message: 'Folder name is required' });
  }

  try {
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    if (!response.data.files.length) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const folderId = response.data.files[0].id;

    await drive.files.delete({ fileId: folderId });

    res.json({ message: 'Folder and all contents deleted successfully!' });
  } catch (error) {
    console.error('Error deleting folder:', error.message);
    res.status(500).json({ message: 'Failed to delete folder', error: error.message });
  }
}
//mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm

function bufferToStream(buffer) {
  const stream = new PassThrough();
  stream.end(buffer);
  return stream;
}








// async function updateFolderDetails(req, res) {
//   try {
//     const userName = userState.userName;
//     if (!userName) {
//       return res.status(401).json({ message: 'User not authenticated' });
//     }

//     const { folderName } = req.params;
//     const { name, description, location, material, date, vehicleNumber, teamMembers, startMeterReading, endMeterReading } = req.body;
//     const files = req.files || [];

//     if (!name || !location || !material || !date || !vehicleNumber || !teamMembers || !startMeterReading || !endMeterReading) {
//       return res.status(400).json({ message: 'All required fields must be provided' });
//     }

//     // Parse material details
//     let parsedMaterial;
//     try {
//       parsedMaterial = JSON.parse(material);
//       if (!Array.isArray(parsedMaterial)) {
//         throw new Error('Material must be an array');
//       }
//     } catch (err) {
//       return res.status(400).json({ message: 'Material details are incorrectly formatted' });
//     }

//     const parentFolderId = '1tGjqpHz5CpF5UNMzBuzWb6gZKl3Fr6TZ';
//     const userFolderResponse = await drive.files.list({
//       q: `name='${userName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents`,
//       fields: 'files(id)',
//     });

//     const userFolderId = userFolderResponse.data?.files?.[0]?.id;
//     if (!userFolderId) {
//       return res.status(404).json({ message: 'User folder not found' });
//     }

//     const targetFolderResponse = await drive.files.list({
//       q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${userFolderId}' in parents`,
//       fields: 'files(id)',
//     });

//     const folderId = targetFolderResponse.data?.files?.[0]?.id;
//     if (!folderId) {
//       return res.status(404).json({ message: `Folder ${folderName} not found` });
//     }

//     const uploadedFiles = Array.isArray(files) && files.length > 0 ? await uploadMultipleFiles(files, folderId) : [];

//     const materialTable = generateMaterialTable(parsedMaterial); // Ensure this function generates a string representation
//     const total = endMeterReading - startMeterReading;

//     const detailsFileResponse = await drive.files.list({
//       q: `'${folderId}' in parents and mimeType='text/plain' and name contains 'details'`,
//       fields: 'files(id, name)',
//     });

//     const detailsFileId = detailsFileResponse.data?.files?.[0]?.id;

//     let previousDetails = '';
//     if (detailsFileId) {
//       const detailsFileContent = await drive.files.get({
//         fileId: detailsFileId,
//         alt: 'media',
//       });
//       previousDetails = detailsFileContent.data || '';
//     }

//     // Extract previous name, description, and location details
//     const nameRegex = /Name: .*/;
//     const descriptionRegex = /Description: .*/;
//     const locationRegex = /Location: .*/;

//     previousDetails = previousDetails
//       .replace(nameRegex, `Name: ${name}`)
//       .replace(descriptionRegex, `Description: ${description}`)
//       .replace(locationRegex, `Location: ${location}`);

//     const detailsContent = `
//       ${previousDetails}
//       \n\n---\n\n
//       Materials:
//       ${materialTable}

//       Schedule:
//       Date: ${date}
//       Vehicle Number: ${vehicleNumber}
//       Team Members:
//       ${Array.isArray(teamMembers) ? teamMembers.map(member => `- ${member}`).join('\n') : ''}
//       Start Meter Reading: ${startMeterReading}
//       End Meter Reading: ${endMeterReading}
//       Total: ${total}
//       Created by: ${userName}
//     `.trim();

//     let updatedDetailsFile;
//     if (detailsFileId) {
//       updatedDetailsFile = await drive.files.update({
//         fileId: detailsFileId,
//         media: {
//           mimeType: 'text/plain',
//           body: bufferToStream(Buffer.from(detailsContent)),
//         },
//       });
//     } else {
//       updatedDetailsFile = await drive.files.create({
//         requestBody: {
//           name: `details of ${name}.txt`,
//           mimeType: 'text/plain',
//           parents: [folderId],
//         },
//         media: {
//           mimeType: 'text/plain',
//           body: bufferToStream(Buffer.from(detailsContent)),
//         },
//       });
//     }

//     return res.json({
//       message: 'Folder and details updated successfully!',
//       folderId,
//       uploadedFiles,
//       detailsFileId: updatedDetailsFile.data.id,
//     });

//   } catch (error) {
//     console.error('Error updating folder and details:', error.message);
//     if (!res.headersSent) {
//       return res.status(500).json({ message: 'Failed to update folder and details', error: error.message });
//     }
//   }
// }


async function updateFolderDetails(req, res) {
  try {
    const userName = userState.userName;
    if (!userName) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { folderName } = req.params;
    const { name, description, location, material, date, vehicleNumber, teamMembers, startMeterReading, endMeterReading } = req.body;
    const files = req.files || [];

    if (!name || !location || !material || !date || !vehicleNumber || !teamMembers || !startMeterReading || !endMeterReading) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Parse material details
    let parsedMaterial;
    try {
      parsedMaterial = JSON.parse(material);
      if (!Array.isArray(parsedMaterial)) {
        throw new Error('Material must be an array');
      }
    } catch (err) {
      return res.status(400).json({ message: 'Material details are incorrectly formatted' });
    }

    const parentFolderId = '1tGjqpHz5CpF5UNMzBuzWb6gZKl3Fr6TZ';
    const userFolderResponse = await drive.files.list({
      q: `name='${userName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents`,
      fields: 'files(id)',
    });

    const userFolderId = userFolderResponse.data?.files?.[0]?.id;
    if (!userFolderId) {
      return res.status(404).json({ message: 'User folder not found' });
    }

    // Find the target folder and check if it needs to be renamed
    const targetFolderResponse = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${userFolderId}' in parents`,
      fields: 'files(id, name)',
    });

    const folder = targetFolderResponse.data?.files?.[0];
    if (!folder) {
      return res.status(404).json({ message: `Folder ${folderName} not found` });
    }

    const folderId = folder.id;

    // Rename the folder if the new name is different from the current name
    if (name && folder.name !== name) {
      await drive.files.update({
        fileId: folderId,
        requestBody: {
          name,
        },
      });
    }

    const uploadedFiles = Array.isArray(files) && files.length > 0 ? await uploadMultipleFiles(files, folderId) : [];

    const materialTable = generateMaterialTable(parsedMaterial); // Ensure this function generates a string representation
    const total = endMeterReading - startMeterReading;

    const detailsFileResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='text/plain' and name contains 'details'`,
      fields: 'files(id, name)',
    });

    const detailsFileId = detailsFileResponse.data?.files?.[0]?.id;

    let previousDetails = '';
    if (detailsFileId) {
      const detailsFileContent = await drive.files.get({
        fileId: detailsFileId,
        alt: 'media',
      });
      previousDetails = detailsFileContent.data || '';
    }

    // Extract previous name, description, and location details
    const nameRegex = /Name: .*/;
    const descriptionRegex = /Description: .*/;
    const locationRegex = /Location: .*/;

    previousDetails = previousDetails
      .replace(nameRegex, `Name: ${name}`)
      .replace(descriptionRegex, `Description: ${description}`)
      .replace(locationRegex, `Location: ${location}`);

    const detailsContent = `
      ${previousDetails}
      \n\n---\n\n
      Materials:
      ${materialTable}

      Schedule:
      Date: ${date}
      Vehicle Number: ${vehicleNumber}
      Team Members:
      ${Array.isArray(teamMembers) ? teamMembers.map(member => `- ${member}`).join('\n') : ''}
      Start Meter Reading: ${startMeterReading}
      End Meter Reading: ${endMeterReading}
      Total: ${total}
      Created by: ${userName}
    `.trim();

    let updatedDetailsFile;
    if (detailsFileId) {
      updatedDetailsFile = await drive.files.update({
        fileId: detailsFileId,
        media: {
          mimeType: 'text/plain',
          body: bufferToStream(Buffer.from(detailsContent)),
        },
      });
    } else {
      updatedDetailsFile = await drive.files.create({
        requestBody: {
          name: `details of ${name}.txt`,
          mimeType: 'text/plain',
          parents: [folderId],
        },
        media: {
          mimeType: 'text/plain',
          body: bufferToStream(Buffer.from(detailsContent)),
        },
      });
    }

    return res.json({
      message: 'Folder and details updated successfully!',
      folderId,
      uploadedFiles,
      detailsFileId: updatedDetailsFile.data.id,
    });

  } catch (error) {
    console.error('Error updating folder and details:', error.message);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to update folder and details', error: error.message });
    }
  }
}

function generateMaterialTable(materials) {
  // Define column widths
  const columnWidths = {
    mainType: 20,
    subTypes: 30,
    whyChoose: 30,
    model: 20
  };

  // Generate the header row
  const header = `| ${'Main Type'.padEnd(columnWidths.mainType)} | ${'Sub Types'.padEnd(columnWidths.subTypes)} | ${'Why Choose'.padEnd(columnWidths.whyChoose)} | ${'Model'.padEnd(columnWidths.model)} |`;
  const separator = `|${'-'.repeat(columnWidths.mainType + 2)}|${'-'.repeat(columnWidths.subTypes + 2)}|${'-'.repeat(columnWidths.whyChoose + 2)}|${'-'.repeat(columnWidths.model + 2)}|`;

  // Generate the rows
  const rows = materials.map(item => {
    return `| ${item.mainType.padEnd(columnWidths.mainType)} | ${item.subTypes.join(',').padEnd(columnWidths.subTypes)} | ${item.whyChoose.padEnd(columnWidths.whyChoose)} | ${item.model.padEnd(columnWidths.model)} |`;
  }).join('\n');

  // Combine header, separator, and rows
  return `${header}\n${separator}\n${rows}`;
}





async function fetchUserFolders(userName) {
  try {
    const response = await drive.files.list({
      q: `name='${userName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    if (!response.data.files || response.data.files.length === 0) {
      return [];
    }

    const userFolderId = response.data.files[0].id;

    const folderResponse = await drive.files.list({
      q: `'${userFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    return folderResponse.data.files || [];
  } catch (error) {
    throw new Error(`Error fetching folders: ${error.message}`);
  }
}

async function getUserFolders(req, res) {
  try {
    const userName = userState.userName;
    if (!userName) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Fetch the user's folders
    const folders = await fetchUserFolders(userName);

    return res.json({ folders });
  } catch (error) {
    console.error('Error fetching user folders:', error.message);
    return res.status(500).json({ message: 'Failed to fetch folders', error: error.message });
  }
}

module.exports = {
  uploadFileAndDetails,
  getFolderAndDetailsByName,
  deleteFolderByName,
  updateFolderDetails,
  loginUser,
  getUserFolders
};
