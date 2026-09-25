import { Router } from 'express';
import { getEmplois } from '../controllers/emplois.controller.js';
import { requireStudent } from '../middleware/auth.js';

const router = Router();
router.get('/', requireStudent, getEmplois);
export default router;
