import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

export async function login(req, res, next) {
  try {
    const { matricule, mot_de_passe } = req.body;
    if (!matricule || !mot_de_passe) {
      return res.status(400).json({ ok: false, message: 'Matricule et mot de passe requis' });
    }

    // Récupérer l'étudiant via son matricule
    const { data: eo, error: eoErr } = await supabase
      .from('etudiants_officiels')
      .select('id, id_classe')
      .eq('matricule', matricule.trim().toUpperCase())
      .single();

    if (eoErr || !eo) {
      return res.status(401).json({ ok: false, message: 'Aucun compte trouvé avec ce matricule' });
    }

    // Récupérer le compte
    const { data: compte, error: cErr } = await supabase
      .from('comptes_etudiants')
      .select('id, mot_de_passe, actif, supprime')
      .eq('id_etudiant', eo.id)
      .single();

    if (cErr || !compte) {
      return res.status(401).json({ ok: false, message: 'Compte introuvable' });
    }
    if (compte.supprime)  return res.status(403).json({ ok: false, message: 'Compte supprimé' });
    if (!compte.actif)    return res.status(403).json({ ok: false, message: 'Compte désactivé' });

    const valid = await bcrypt.compare(mot_de_passe, compte.mot_de_passe);
    if (!valid) return res.status(401).json({ ok: false, message: 'Mot de passe incorrect' });

    const token = signToken({
      role: 'etudiant',
      id_etudiant: eo.id,
      id_classe:   eo.id_classe
    });

    res.json({ ok: true, token, id_etudiant: eo.id, id_classe: eo.id_classe });
  } catch (e) { next(e); }
}

// ─── Vérification identité (étape 1 de l'inscription) ─────────────────────
export async function verifierEtudiant(req, res, next) {
  try {
    const { matricule, date_naissance } = req.body;
    if (!matricule || !date_naissance) {
      return res.status(400).json({ status: 'empty' });
    }

    // 1. Chercher dans le registre officiel
    const { data: eo } = await supabase
      .from('etudiants_officiels')
      .select('id, prenom, nom, date_naissance')
      .eq('matricule', matricule.trim().toUpperCase())
      .eq('date_naissance', date_naissance)
      .single();

    if (!eo) {
      return res.json({ status: 'not_found' });
    }

    // 2. Vérifier état du compte
    const { data: compte } = await supabase
      .from('comptes_etudiants')
      .select('actif, supprime')
      .eq('id_etudiant', eo.id)
      .single();

    if (!compte) {
      return res.json({ status: 'found', etudiant: eo });
    }
    if (compte.supprime) return res.json({ status: 'deleted' });
    if (!compte.actif)   return res.json({ status: 'disabled' });
    return res.json({ status: 'already_active' });

  } catch (e) { next(e); }
}

export async function register(req, res, next) {
  try {
    const { id_etudiant, mot_de_passe, telephone } = req.body;
    if (!id_etudiant || !mot_de_passe) {
      return res.status(400).json({ ok: false, message: 'Données invalides' });
    }
    if (mot_de_passe.length < 6) {
      return res.status(400).json({ ok: false, message: 'Mot de passe trop court (6 caractères min)' });
    }
    if (telephone && !/^[0-9]{8}$/.test(telephone)) {
      return res.status(400).json({ ok: false, message: 'Numéro de téléphone invalide (8 chiffres requis)' });
    }

    // Récupérer la classe de l'étudiant
    const { data: eo } = await supabase
      .from('etudiants_officiels')
      .select('id, id_classe')
      .eq('id', id_etudiant)
      .single();

    if (!eo) {
      return res.status(404).json({ ok: false, message: 'Étudiant introuvable' });
    }

    // Vérifier qu'il n'a pas déjà un compte actif
    const { data: existing } = await supabase
      .from('comptes_etudiants')
      .select('id, supprime')
      .eq('id_etudiant', eo.id)
      .single();

    if (existing && !existing.supprime) {
      return res.status(409).json({ ok: false, message: 'Un compte existe déjà pour cet étudiant' });
    }

    // Si supprimé → supprimer d'abord pour recréer
    if (existing?.supprime) {
      await supabase.from('comptes_etudiants').delete().eq('id_etudiant', eo.id);
    }

    const hash = await bcrypt.hash(mot_de_passe, 12);
    const { error } = await supabase.from('comptes_etudiants').insert({
      id_etudiant:  eo.id,
      id_classe:    eo.id_classe,
      telephone:    telephone || null,
      mot_de_passe: hash,
      actif:        true
    });

    if (error) throw error;

    // Le PHP ouvre automatiquement la session après l'inscription.
    // Avec JWT, on reproduit ce comportement en retournant directement le token.
    const token = signToken({
      role: 'etudiant',
      id_etudiant: eo.id,
      id_classe: eo.id_classe
    });

    res.status(201).json({
      ok: true,
      message: 'Compte créé avec succès',
      token,
      id_etudiant: eo.id,
      id_classe: eo.id_classe
    });
  } catch (e) { next(e); }
}

export async function changePassword(req, res, next) {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
    if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
      return res.status(400).json({ ok: false, message: 'Les deux mots de passe sont requis' });
    }
    if (nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ ok: false, message: 'Nouveau mot de passe trop court' });
    }

    const { data: compte } = await supabase
      .from('comptes_etudiants')
      .select('mot_de_passe')
      .eq('id_etudiant', req.etudiant.id_etudiant)
      .single();

    if (!compte) return res.status(404).json({ ok: false, message: 'Compte introuvable' });

    const valid = await bcrypt.compare(ancien_mot_de_passe, compte.mot_de_passe);
    if (!valid) return res.status(401).json({ ok: false, message: 'Ancien mot de passe incorrect' });

    const hash = await bcrypt.hash(nouveau_mot_de_passe, 12);
    await supabase
      .from('comptes_etudiants')
      .update({ mot_de_passe: hash, updated_at: new Date().toISOString() })
      .eq('id_etudiant', req.etudiant.id_etudiant);

    res.json({ ok: true, message: 'Mot de passe modifié avec succès' });
  } catch (e) { next(e); }
}

// ─── Mot de passe oublié : étape 1, vérification d'identité ────────────────
// Équivalent de etudiants/ajax/ajax_verif_identite.php : au lieu de stocker
// reset_id_etudiant en session (PHP), on émet un token JWT de courte durée
// que le front doit renvoyer à l'étape 2.
export async function forgotPassword(req, res, next) {
  try {
    const { matricule, nom, prenom, date_naissance } = req.body;
    if (!matricule || !nom || !prenom || !date_naissance) {
      return res.status(400).json({ ok: false, message: 'Tous les champs sont obligatoires' });
    }

    const { data: e } = await supabase
      .from('etudiants_officiels')
      .select('id, nom, prenom, date_naissance')
      .eq('matricule', matricule.trim().toUpperCase())
      .single();

    if (!e) return res.status(404).json({ ok: false, message: 'Matricule incorrect' });
    if (e.nom.localeCompare(nom.trim(), undefined, { sensitivity: 'base' }) !== 0) {
      return res.status(400).json({ ok: false, message: 'Nom incorrect' });
    }
    if (e.prenom.localeCompare(prenom.trim(), undefined, { sensitivity: 'base' }) !== 0) {
      return res.status(400).json({ ok: false, message: 'Prénom incorrect' });
    }
    if (e.date_naissance !== date_naissance) {
      return res.status(400).json({ ok: false, message: 'Date de naissance incorrecte' });
    }

    const resetToken = jwt.sign(
      { role: 'reset', id_etudiant: e.id },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({ ok: true, resetToken });
  } catch (e) { next(e); }
}

// ─── Mot de passe oublié : étape 2, nouveau mot de passe ───────────────────
// Équivalent de etudiants/ajax/ajax_reset_mdp.php
export async function resetPassword(req, res, next) {
  try {
    const { resetToken, mdp1, mdp2 } = req.body;
    if (!resetToken) {
      return res.status(401).json({ ok: false, message: 'Session expirée, recommencez la vérification' });
    }
    if (!mdp1 || !mdp2) {
      return res.status(400).json({ ok: false, message: 'Champs obligatoires' });
    }
    if (mdp1 !== mdp2) {
      return res.status(400).json({ ok: false, message: 'Les mots de passe ne correspondent pas' });
    }
    if (mdp1.length < 6) {
      return res.status(400).json({ ok: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ ok: false, message: 'Session expirée, recommencez la vérification' });
    }
    if (payload.role !== 'reset') {
      return res.status(401).json({ ok: false, message: 'Session invalide' });
    }

    const hash = await bcrypt.hash(mdp1, 12);
    const { error } = await supabase
      .from('comptes_etudiants')
      .update({ mot_de_passe: hash, updated_at: new Date().toISOString() })
      .eq('id_etudiant', payload.id_etudiant);

    if (error) throw error;

    res.json({ ok: true, message: 'Mot de passe modifié avec succès' });
  } catch (e) { next(e); }
}

export async function logout(req, res) {
  // JWT stateless — le client supprime simplement le token
  res.json({ ok: true, message: 'Déconnecté' });
}
