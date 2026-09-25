import { Router } from 'express';
import { getActualites, getDocuments } from '../controllers/public.controller.js';

const router = Router();

// Routes publiques — aucune auth requise
router.get('/actualites', getActualites);
router.get('/documents',  getDocuments);

export default router;
