import { Router } from 'express';
import {
  listDocuments, createDocument, updateDocument, deleteDocument,
  addFile, updateFile, deleteFile
} from '../../controllers/admin/documents.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { uploadDocument } from '../../middleware/upload.js';

const router = Router();
router.use(requireAdmin);

router.get('/',              listDocuments);
router.post('/',             uploadDocument.array('fichiers', 20), createDocument);
router.put('/:id',           updateDocument);
router.delete('/:id',        deleteDocument);
router.post('/:id/files',    uploadDocument.array('fichiers', 20), addFile);
router.put('/files/:fileId', uploadDocument.single('nouveau_fichier'), updateFile);
router.delete('/files/:fileId', deleteFile);

export default router;