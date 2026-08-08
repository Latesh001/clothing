const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, GIF, MP4, WebM allowed.'), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

exports.uploadSingle = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('image');
exports.uploadMultiple = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }).array('images', 10);
