import bcrypt from 'bcryptjs';
import { supabase } from '../../config/supabase.js';

export async function listAdmins(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, username, nom_complet, is_super_admin, created_at')
      .order('created_at');
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (error) { next(error); }
}

export async function createAdmin(req, res, next) {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const nomComplet = typeof req.body.nom_complet === 'string' ? req.body.nom_complet.trim() : '';
    const password = typeof req.body.mot_de_passe === 'string' ? req.body.mot_de_passe : '';

    if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
      return res.status(400).json({ ok: false, message: 'Identifiant : 3 à 40 caractères (lettres, chiffres, ., _ ou -)' });
    }
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ ok: false, message: 'Le mot de passe doit contenir 8 caractères minimum et 72 octets maximum' });
    }
    if (nomComplet.length > 100) {
      return res.status(400).json({ ok: false, message: 'Le nom complet ne peut dépasser 100 caractères' });
    }

    const { data, error } = await supabase
      .from('admins')
      .insert({
        username,
        mot_de_passe: await bcrypt.hash(password, 12),
        nom_complet: nomComplet || username,
        is_super_admin: req.body.is_super_admin === true
      })
      .select('id, username, nom_complet, is_super_admin, created_at')
      .single();

    if (error?.code === '23505') {
      return res.status(409).json({ ok: false, message: 'Cet identifiant est déjà utilisé' });
    }
    if (error) throw error;
    res.status(201).json({ ok: true, data });
  } catch (error) { next(error); }
}

export async function deleteAdmin(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ ok: false, message: 'Identifiant admin invalide' });
    }
    if (id === Number(req.admin.id)) {
      return res.status(400).json({ ok: false, message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const { data: target, error: targetError } = await supabase
      .from('admins')
      .select('id, is_super_admin')
      .eq('id', id)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) return res.status(404).json({ ok: false, message: 'Administrateur introuvable' });

    if (target.is_super_admin) {
      const { count, error: countError } = await supabase
        .from('admins')
        .select('id', { count: 'exact', head: true })
        .eq('is_super_admin', true);
      if (countError) throw countError;
      if (count <= 1) {
        return res.status(409).json({ ok: false, message: 'Le dernier super-administrateur ne peut pas être supprimé' });
      }
    }

    const { error } = await supabase.from('admins').delete().eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) { next(error); }
}