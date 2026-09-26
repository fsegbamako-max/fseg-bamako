import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

/**
 * Middleware : vérifie le JWT étudiant
 * Injecte req.etudiant = { id_etudiant, id_classe }
 */
export function requireStudent(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Token manquant' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'etudiant') {
      return res.status(403).json({ ok: false, message: 'Accès refusé' });
    }
    req.etudiant = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Token invalide ou expiré' });
  }
}

/**
 * Middleware : vérifie le JWT admin
 * Injecte req.admin = { id, username }
 */
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Token manquant' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Accès admin requis' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Token invalide ou expiré' });
  }
}

export async function requireSuperAdmin(req, res, next) {
  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('is_super_admin')
      .eq('id', req.admin.id)
      .single();

    if (error || !admin?.is_super_admin) {
      return res.status(403).json({ ok: false, message: 'Accès réservé au super-administrateur' });
    }

    next();
  } catch (error) {
    next(error);
  }
}
