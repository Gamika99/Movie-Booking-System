const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

// Ensure upload directories exist
const createUploadDirs = () => {
    const dirs = [
        'uploads/posters',
        'uploads/theaters',
        'uploads/temp'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads/temp';
        if (file.fieldname === 'poster') {
            folder = 'uploads/posters';
        } else if (file.fieldname === 'theaterImage') {
            folder = 'uploads/theaters';
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Single file upload
const uploadSingle = (fieldName) => upload.single(fieldName);

// Multiple files upload
const uploadMultiple = (fields) => upload.fields(fields);

// Array of files
const uploadArray = (fieldName, maxCount) => upload.array(fieldName, maxCount);

module.exports = {
    uploadSingle,
    uploadMultiple,
    uploadArray,
    upload
};