import { Router } from 'express';
import {
  listEtudiants, getEtudiant, createEtudiant, updateEtudiant, deleteEtudiant,
  toggleCompte, listComptes, importEtudiants, exportEtudiants, deleteImport,
  listImports, listImportStudents, deleteImports
} from '../../controllers/admin/etudiants.controller.js';
import { requireAdmin } from '../../middleware/auth.js';
import { uploadExcel, uploadPhoto } from '../../middleware/upload.js';

const router = Router();
router.use(requireAdmin);

router.get('/',                listEtudiants);
router.get('/comptes',         listComptes);
router.get('/export',          exportEtudiants);
router.get('/imports',         listImports);
router.get('/imports/:id',     listImportStudents);
router.delete('/imports',      deleteImports);
router.get('/:id',             getEtudiant);
router.post('/',               createEtudiant);
router.put('/:id',             uploadPhoto.single('photo'), updateEtudiant);
router.delete('/:id',          deleteEtudiant);
router.post('/:id/toggle',     toggleCompte);
router.post('/import',         uploadExcel.single('fichier'), importEtudiants);
router.delete('/import/:id',   deleteImport);

export default router;
