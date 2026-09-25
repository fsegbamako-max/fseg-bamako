import multer from 'multer';

// Stockage en mémoire → on passe le buffer à Supabase Storage
const storage = multer.memoryStorage();

function fileFilter(allowedMimes) {
  return (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`), false);
    }
  };
}

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: fileFilter([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg','image/png','image/gif','image/webp',
    'video/mp4','video/mpeg','video/quicktime','video/x-msvideo',
  ])
});

export const uploadPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter(['image/jpeg','image/png','image/webp','image/gif'])
});

export const uploadExcel = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: fileFilter([
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ])
});
