import { Router } from 'express';
import { getProfil, updatePhoto, updateTelephone } from '../controllers/profil.controller.js';
import { requireStudent } from '../middleware/auth.js';
import { uploadPhoto } from '../middleware/upload.js';

const router = Router();

router.get('/',           requireStudent, getProfil);
router.put('/telephone',  requireStudent, updateTelephone);
router.post('/photo',     requireStudent, uploadPhoto.single('photo'), updatePhoto);

export default router;
