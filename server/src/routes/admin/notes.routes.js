import { Router } from 'express';
import {
  listNotes, createNote, updateNote, deleteNote,
  addFile, updateFile, deleteFile,
  importNotes, listImports, deleteImport
} from '../../controllers/admin/notes.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { uploadDocument, uploadExcel } from '../../middleware/upload.js';

const router = Router();
router.use(requireAdmin);

// Publications de documents de notes
router.get('/',              listNotes);
router.post('/',             uploadDocument.array('fichiers', 20), createNote);
router.put('/:id',           updateNote);
router.delete('/:id',        deleteNote);
router.post('/:id/files',    uploadDocument.array('fichiers', 20), addFile);
router.put('/files/:fileId', uploadDocument.single('nouveau_fichier'), updateFile);
router.delete('/files/:fileId', deleteFile);

// Imports de notes individuelles (Excel)
router.get('/imports',       listImports);
router.post('/import',       uploadExcel.single('fichier'), importNotes);
router.delete('/import/:id', deleteImport);

export default router;
