import { Router } from 'express';
import { getCours } from '../controllers/cours.controller.js';
import { requireStudent } from '../middleware/auth.js';

const router = Router();
router.get('/', requireStudent, getCours);
export default router;
