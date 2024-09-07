const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  place: { type: String, required: true },
  description: { type: String, required: true },
  images: [String], // Array of image IDs
  materialDetails: { type: Object, required: true }, // JSON object
  folderId: { type: String, required: true }, // Google Drive folder ID
});

module.exports = mongoose.model('Upload', uploadSchema);
