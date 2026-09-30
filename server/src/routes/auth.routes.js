import { Router } from 'express';
import { createHash } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { login, logout, register, verifierEtudiant, forgotPassword, resetPassword, changePassword } from '../controllers/auth.controller.js';
import { requireStudent } from '../middleware/auth.js';

const router = Router();

const forgotPasswordLimiter = rateLimit({
	windowMs: 30 * 60 * 1000,
	max: 5,
	skipSuccessfulRequests: true,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: req => {
		const matricule = typeof req.body?.matricule === 'string'
			? req.body.matricule.trim().toUpperCase()
			: '';
		const key = matricule ? `matricule:${matricule}` : `ip:${req.ip}`;
		return createHash('sha256').update(key).digest('hex');
	},
	handler: (_req, res) => res.status(429).json({
		ok: false,
		message: 'Trop de tentatives. Réessayez dans 30 minutes.'
	})
});

router.post('/login',             login);
router.post('/verifier-etudiant', verifierEtudiant);
router.post('/register',          register);
router.post('/forgot-password',   forgotPasswordLimiter, forgotPassword);
router.post('/reset-password',    resetPassword);
router.post('/change-password',   requireStudent, changePassword);
router.post('/logout',            requireStudent, logout);

export default router;
