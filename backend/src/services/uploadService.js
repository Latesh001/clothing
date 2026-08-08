const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadImage, uploadVideo, uploadMultiple } = require('./cloudinaryService');

const uploadsDir = path.join(__dirname, '../../uploads/products');

const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

const hasCloudinary = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const saveLocalImage = (file) => {
  ensureUploadsDir();
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `${uuidv4()}${ext}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, file.buffer);
  return {
    url: `/uploads/products/${filename}`,
    publicId: filename,
  };
};

exports.saveProductImages = async (files = []) => {
  if (!files.length) return [];

  if (hasCloudinary()) {
    try {
      const uploads = await uploadMultiple(files);
      return uploads.map((u) => ({ url: u.url, publicId: u.publicId }));
    } catch (err) {
      console.warn('Cloudinary upload failed, using local storage:', err.message);
    }
  }

  return files.map(saveLocalImage);
};

exports.saveProductVideos = async (files = []) => {
  if (!files.length) return [];

  if (hasCloudinary()) {
    try {
      return Promise.all(files.map((f) => uploadVideo(f)));
    } catch (err) {
      console.warn('Cloudinary video upload failed:', err.message);
    }
  }

  ensureUploadsDir();
  return files.map((file) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const filename = `${uuidv4()}${ext}`;
    fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);
    return { url: `/uploads/products/${filename}`, publicId: filename };
  });
};
