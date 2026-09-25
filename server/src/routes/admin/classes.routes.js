import { Router } from 'express';
import { listClasses, createClasse, updateClasse, deleteClasse } from '../../controllers/admin/classes.controller.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

router.get('/',    listClasses);
router.post('/',   createClasse);
router.put('/:id', updateClasse);
router.delete('/:id', deleteClasse);

export default router;
