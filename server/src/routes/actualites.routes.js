import { Router } from 'express';
import { getActualites, getActualite } from '../controllers/actualites.controller.js';

const router = Router();
router.get('/',    getActualites);
router.get('/:id', getActualite);
export default router;
