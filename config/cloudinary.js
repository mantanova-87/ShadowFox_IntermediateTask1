const cloudinary = require('cloudinary').v2;
const { cloudinaryUrl } = require('./env');

// Cloudinary automatically picks up the CLOUDINARY_URL from process.env if present.
// However, since we validated it in env.js, we can also manually configure it to be safe.
if (cloudinaryUrl) {
  // CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
  // Calling config with no arguments forces it to use the env variable.
  cloudinary.config();
} else {
  console.warn('Cloudinary URL not configured. Image uploads will fail.');
}

module.exports = cloudinary;
