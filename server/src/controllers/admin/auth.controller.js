import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../../config/supabase.js';

function signAdminToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '8h'
  });
}

export async function adminLogin(req, res, next) {
  try {
    const { username, mot_de_passe } = req.body;
    if (!username || !mot_de_passe) {
      return res.status(400).json({ ok: false, message: 'Identifiants requis' });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, username, mot_de_passe, nom_complet, is_super_admin')
      .eq('username', username.trim().toLowerCase())
      .single();

    if (error || !admin) {
      return res.status(401).json({ ok: false, message: 'Identifiants invalides' });
    }

    const valid = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
    if (!valid) return res.status(401).json({ ok: false, message: 'Identifiants invalides' });

    const token = signAdminToken({
      role:        'admin',
      id:          admin.id,
      username:    admin.username,
      nom_complet: admin.nom_complet,
      is_super_admin: admin.is_super_admin
    });

    res.json({ ok: true, token, admin: { id: admin.id, username: admin.username, nom_complet: admin.nom_complet, is_super_admin: admin.is_super_admin } });
  } catch (e) { next(e); }
}

export async function adminLogout(req, res) {
  res.json({ ok: true, message: 'Déconnecté' });
}

export async function getMe(req, res) {
  res.json({ ok: true, admin: req.admin });
}
