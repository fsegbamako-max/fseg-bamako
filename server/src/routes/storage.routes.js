import { Router } from 'express';
import { streamStorageFile } from '../controllers/storage.controller.js';

const router = Router();

router.get('/:token', streamStorageFile);

export default router;