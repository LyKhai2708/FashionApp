const multer = require('multer');
const path = require('path');
const ApiError = require('../api-error');

const storage = multer.diskStorage({
    destination: (req, file, cb)  => {
        cb(null, './public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniquePrefix + path.extname(file.originalname));
    },
});
function imageUpload(req, res, next) {
    const upload = multer({ storage: storage }).single('imageFile');
    console.log(upload);
    upload(req, res, (err) => {
        if(err instanceof multer.MulterError) {
            return next(new ApiError(400, 'An error occurred while uploading the image'));
        }else if (err) {
            return next(new ApiError(500, 'An unknown error occurred while uploading the image'));
        }
        next();
    });
}    

module.exports = imageUpload;