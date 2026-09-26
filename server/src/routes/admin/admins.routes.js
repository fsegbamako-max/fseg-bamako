import { Router } from 'express';
import { createAdmin, deleteAdmin, listAdmins } from '../../controllers/admin/admins.controller.js';
import { requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';

const router = Router();
router.use(requireAdmin, requireSuperAdmin);

router.get('/', listAdmins);
router.post('/', createAdmin);
router.delete('/:id', deleteAdmin);

export default router;