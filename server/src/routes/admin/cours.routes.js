import { Router } from 'express';
import {
  listCours, createCours, updateCours, deleteCours,
  addFile, updateFile, deleteFile
} from '../../controllers/admin/cours.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { uploadDocument } from '../../middleware/upload.js';

const router = Router();
router.use(requireAdmin);

router.get('/',              listCours);
router.post('/',             uploadDocument.array('fichiers', 20), createCours);
router.put('/:id',           updateCours);
router.delete('/:id',        deleteCours);
router.post('/:id/files',    uploadDocument.array('fichiers', 20), addFile);
router.put('/files/:fileId', uploadDocument.single('nouveau_fichier'), updateFile);
router.delete('/files/:fileId', deleteFile);

export default router;
