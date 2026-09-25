import { Router } from 'express';
import {
  listActualites, createActualite, updateActualite, deleteActualite,
  addFile, deleteFile
} from '../../controllers/admin/actualites.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { uploadDocument } from '../../middleware/upload.js';

const router = Router();
router.use(requireAdmin);

router.get('/',           listActualites);
router.post('/',          uploadDocument.array('fichiers', 5), createActualite);
router.put('/:id',        updateActualite);
router.delete('/:id',     deleteActualite);
router.post('/:id/files', uploadDocument.array('fichiers', 5), addFile);
router.delete('/files/:fileId', deleteFile);

export default router;
