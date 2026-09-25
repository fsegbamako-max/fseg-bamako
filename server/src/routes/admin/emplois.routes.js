import { Router } from 'express';
import {
  listEmplois, createEmploi, updateEmploi, deleteEmploi,
  addFile, updateFile, deleteFile
} from '../../controllers/admin/emplois.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { uploadDocument } from '../../middleware/upload.js';

const router = Router();
router.use(requireAdmin);

router.get('/',              listEmplois);
router.post('/',             uploadDocument.array('fichiers', 10), createEmploi);
router.put('/:id',           updateEmploi);
router.delete('/:id',        deleteEmploi);
router.post('/:id/files',    uploadDocument.array('fichiers', 10), addFile);
router.put('/files/:fileId', uploadDocument.single('nouveau_fichier'), updateFile);
router.delete('/files/:fileId', deleteFile);

export default router;
