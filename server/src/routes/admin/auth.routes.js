import { Router } from 'express';
import { adminLogin, adminLogout, getMe } from '../../controllers/admin/auth.controller.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = Router();
router.post('/login',  adminLogin);
router.post('/logout', requireAdmin, adminLogout);
router.get('/me',      requireAdmin, getMe);
export default router;
