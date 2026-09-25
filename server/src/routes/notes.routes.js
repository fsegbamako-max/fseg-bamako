import { Router } from 'express';
import { getNotes, getNoteDocuments } from '../controllers/notes.controller.js';
import { requireStudent } from '../middleware/auth.js';

const router = Router();
router.get('/',         requireStudent, getNotes);
router.get('/documents', requireStudent, getNoteDocuments);
export default router;
