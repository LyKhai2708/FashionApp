const multer = require('multer');
const path = require('path');
const ApiError = require('../api-error');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniquePrefix + path.extname(file.originalname));
    },
});

// File filter để chỉ cho phép hình ảnh
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new ApiError(400, 'Only image files are allowed'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 30
    }
});

// Middleware cho upload 1 file
const uploadSingle = (fieldName = 'imageFile') => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new ApiError(400, 'File size too large (max 5MB)'));
                }
                return next(new ApiError(400, 'An error occurred while uploading the image'));
            } else if (err) {
                return next(err);
            }
            next();
        });
    };
};

// Middleware cho upload nhiều files
const uploadMultiple = (fieldName = 'images', maxCount = 5) => {
    return (req, res, next) => {
        upload.array(fieldName, maxCount)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new ApiError(400, 'File size too large (max 5MB per file)'));
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return next(new ApiError(400, `Too many files (max ${maxCount} files)`));
                }
                return next(new ApiError(400, 'An error occurred while uploading images'));
            } else if (err) {
                return next(err);
            }
            next();
        });
    };
};

// Middleware cho upload mixed fields
const uploadFields = (fields) => {
    return (req, res, next) => {
        upload.fields(fields)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new ApiError(400, 'File size too large (max 5MB per file)'));
                }
                return next(new ApiError(400, 'An error occurred while uploading files'));
            } else if (err) {
                return next(err);
            }
            next();
        });
    };
};

module.exports = {
    uploadSingle,
    uploadMultiple, 
    uploadFields
};