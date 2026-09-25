import { Router } from 'express';
import { getDocuments } from '../controllers/documents.controller.js';

const router = Router();
router.get('/', getDocuments);
export default router;
