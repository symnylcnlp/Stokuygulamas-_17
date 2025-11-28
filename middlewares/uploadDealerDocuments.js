const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseUploadDir = path.join(__dirname, '..', 'public', 'uploads', 'dealers');

fs.mkdirSync(baseUploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, baseUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname || '');
        cb(null, `${uniqueSuffix}${ext || '.pdf'}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (!file.mimetype || file.mimetype !== 'application/pdf') {
        return cb(new Error('Sadece PDF dosyaları yüklenebilir'), false);
    }
    cb(null, true);
};

const uploadDealerDocuments = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

module.exports = uploadDealerDocuments;


