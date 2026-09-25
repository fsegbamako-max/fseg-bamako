import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import { errorHandler, notFound } from './middleware/errorHandler.js';

// Routes publiques (sans auth)
import publicRoutes from './routes/public.routes.js';

// Routes étudiants
import authRoutes      from './routes/auth.routes.js';
import profilRoutes    from './routes/profil.routes.js';
import coursRoutes     from './routes/cours.routes.js';
import notesRoutes     from './routes/notes.routes.js';
import emploisRoutes   from './routes/emplois.routes.js';
import actusRoutes     from './routes/actualites.routes.js';
import documentsRoutes from './routes/documents.routes.js';

// Routes admin
import adminAuthRoutes      from './routes/admin/auth.routes.js';
import adminEtudiantsRoutes from './routes/admin/etudiants.routes.js';
import adminCoursRoutes     from './routes/admin/cours.routes.js';
import adminNotesRoutes     from './routes/admin/notes.routes.js';
import adminEmploisRoutes   from './routes/admin/emplois.routes.js';
import adminActusRoutes     from './routes/admin/actualites.routes.js';
import adminDocumentsRoutes from './routes/admin/documents.routes.js';
import adminClassesRoutes   from './routes/admin/classes.routes.js';
import adminStatsRoutes     from './routes/admin/stats.routes.js';

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Sécurité ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// ─── Rate limiting ───────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { ok: false, message: 'Trop de tentatives, réessayez dans 15 minutes' }
}));
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { ok: false, message: 'Trop de requêtes' }
}));

// ─── Body parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'fseg-api', env: process.env.NODE_ENV || 'development' });
});

// ─── Routes publiques ────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/public',         publicRoutes);  // sans auth : actualites + documents site public
app.use('/api/actualites',     actusRoutes);   // étudiant connecté
app.use('/api/documents',      documentsRoutes);

// ─── Routes étudiants (protégées JWT) ────────────────────────
app.use('/api/profil',  profilRoutes);
app.use('/api/cours',   coursRoutes);
app.use('/api/notes',   notesRoutes);
app.use('/api/emplois', emploisRoutes);

// ─── Routes admin ────────────────────────────────────────────
app.use('/api/admin/auth',      adminAuthRoutes);
app.use('/api/admin/etudiants', adminEtudiantsRoutes);
app.use('/api/admin/cours',     adminCoursRoutes);
app.use('/api/admin/notes',     adminNotesRoutes);
app.use('/api/admin/emplois',   adminEmploisRoutes);
app.use('/api/admin/actualites',adminActusRoutes);
app.use('/api/admin/documents', adminDocumentsRoutes);
app.use('/api/admin/classes',   adminClassesRoutes);
app.use('/api/admin/stats',     adminStatsRoutes);

// ─── Errors ──────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅  FSEG API démarré sur le port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

export default app;
