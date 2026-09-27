import path from 'path';
import { supabase } from '../config/supabase.js';
import { uploadToStorage, deleteFromStorage } from '../services/storage.service.js';

export async function getProfil(req, res, next) {
  try {
    const id = req.etudiant.id_etudiant;

    const { data, error } = await supabase
      .from('etudiants_officiels')
      .select(`
        prenom, nom, matricule, cenou, date_naissance, lieu_naissance,
        passage, amphi, numero_ordre,
        classes!inner(nom_classe, niveau),
        comptes_etudiants!inner(telephone, photo_profil)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ ok: false, message: 'Étudiant introuvable' });
    }
    const compte = Array.isArray(data.comptes_etudiants)
      ? data.comptes_etudiants[0]
      : data.comptes_etudiants;

    res.json({
      ok: true,
      data: {
        prenom:         data.prenom,
        nom:            data.nom,
        matricule:      data.matricule,
        cenou:          data.cenou,
        date_naissance: data.date_naissance,
        lieu_naissance: data.lieu_naissance,
        passage:        data.passage,
        amphi:          data.amphi,
        numero_ordre:   data.numero_ordre,
        nom_classe:     data.classes.nom_classe,
        niveau:         data.classes.niveau,
        telephone:      compte?.telephone ?? null,
        photo_profil:   compte?.photo_profil ?? null
      }
    });
  } catch (e) { next(e); }
}

export async function updateTelephone(req, res, next) {
  try {
    const telephone = typeof req.body.telephone === 'string' ? req.body.telephone.trim() : '';
    if (!/^[0-9]{8}$/.test(telephone)) {
      return res.status(400).json({ ok: false, message: 'Le numéro de téléphone doit contenir exactement 8 chiffres.' });
    }

    const { data: compte, error: compteError } = await supabase
      .from('comptes_etudiants')
      .select('id')
      .eq('id_etudiant', req.etudiant.id_etudiant)
      .eq('actif', true)
      .eq('supprime', false)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (compteError) throw compteError;
    if (!compte) return res.status(404).json({ ok: false, message: 'Compte étudiant introuvable' });

    const { data, error } = await supabase
      .from('comptes_etudiants')
      .update({ telephone, updated_at: new Date().toISOString() })
      .eq('id', compte.id)
      .select('telephone')
      .single();

    if (error) throw error;

    res.json({ ok: true, telephone: data.telephone });
  } catch (e) { next(e); }
}

export async function updatePhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'Aucun fichier reçu' });
    }

    const id = req.etudiant.id_etudiant;

    // Supprimer l'ancienne photo
    const { data: compte } = await supabase
      .from('comptes_etudiants')
      .select('photo_profil')
      .eq('id_etudiant', id)
      .single();

    if (compte?.photo_profil) {
      await deleteFromStorage(compte.photo_profil);
    }

    // Uploader la nouvelle
    const url = await uploadToStorage(
      req.file.buffer,
      'profils',
      `profil_${id}_${Date.now()}${path.extname(req.file.originalname)}`,
      req.file.mimetype
    );

    await supabase
      .from('comptes_etudiants')
      .update({ photo_profil: url, updated_at: new Date().toISOString() })
      .eq('id_etudiant', id);

    res.json({ ok: true, photo: url });
  } catch (e) { next(e); }
}
