const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

exports.uploadImage = async (file, folder = 'products') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `manikanta-khadi/${folder}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    bufferToStream(file.buffer).pipe(uploadStream);
  });
};

exports.uploadVideo = async (file, folder = 'products/videos') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `manikanta-khadi/${folder}`,
        resource_type: 'video',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, publicId: result.public_id, thumbnail: result.thumbnail_url });
      }
    );
    bufferToStream(file.buffer).pipe(uploadStream);
  });
};

exports.deleteFile = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

exports.uploadMultiple = async (files, folder = 'products') => {
  const uploads = files.map(file => exports.uploadImage(file, folder));
  return Promise.all(uploads);
};
