import { Router } from 'express';
import { login, logout, register, verifierEtudiant, forgotPassword, resetPassword, changePassword } from '../controllers/auth.controller.js';
import { requireStudent } from '../middleware/auth.js';

const router = Router();

router.post('/login',             login);
router.post('/verifier-etudiant', verifierEtudiant);
router.post('/register',          register);
router.post('/forgot-password',   forgotPassword);
router.post('/reset-password',    resetPassword);
router.post('/change-password',   requireStudent, changePassword);
router.post('/logout',            requireStudent, logout);

export default router;
