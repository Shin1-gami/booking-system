
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Папка для збереження файлів
const uploadDirectory = path.resolve(process.cwd(), 'uploads');

// Дозволені формати файлів
const allowedTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf'
};

// Налаштування збереження файлів
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const filename = `${randomUUID()}${extension}`;

    cb(null, filename);
  }
});

// Перевірка формату файлу
function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();

  const expectedMimeType = allowedTypes[extension];

  if (!expectedMimeType || file.mimetype !== expectedMimeType) {
    const error = new Error(
      'Дозволені формати: JPG, JPEG, PNG, GIF, PDF'
    );

    error.status = 400;

    return cb(error);
  }

  cb(null, true);
}

// Налаштування Multer
export const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});
