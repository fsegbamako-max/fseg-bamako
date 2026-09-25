import { Router } from 'express';
import { getDashboardStats } from '../../controllers/admin/stats.controller.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = Router();
router.use(requireAdmin);
router.get('/', getDashboardStats);
export default router;
