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
        telephone:      data.comptes_etudiants.telephone,
        photo_profil:   data.comptes_etudiants.photo_profil
      }
    });
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
