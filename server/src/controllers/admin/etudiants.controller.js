import bcrypt from 'bcryptjs';
import { supabase } from '../../config/supabase.js';
import { uploadToStorage, deleteFromStorage } from '../../services/storage.service.js';
import xlsx from 'xlsx';

export async function listEtudiants(req, res, next) {
  try {
    const { id_classe, search, page = 1, limit = 50 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('etudiants_officiels')
      .select('id, matricule, prenom, nom, numero_ordre, id_classe, classes(nom_classe)', { count: 'exact' })
      .order('numero_ordre')
      .range(from, from + parseInt(limit) - 1);

    if (id_classe) query = query.eq('id_classe', parseInt(id_classe));
    if (search)    query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,matricule.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ ok: true, data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) { next(e); }
}

export async function listComptes(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('comptes_etudiants')
      .select('id, actif, supprime, date_creation, etudiants_officiels(matricule, prenom, nom, classes(nom_classe))')
      .eq('supprime', false)
      .order('date_creation', { ascending: false });
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function getEtudiant(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('etudiants_officiels')
      .select('*, classes(*), comptes_etudiants(id, actif, telephone, photo_profil, date_creation)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ ok: false, message: 'Étudiant introuvable' });
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function createEtudiant(req, res, next) {
  try {
    const { matricule, prenom, nom, id_classe, numero_ordre, cenou, date_naissance, lieu_naissance, passage, amphi } = req.body;
    if (!matricule || !prenom || !nom || !id_classe) return res.status(400).json({ ok: false, message: 'Champs requis manquants' });

    const { data, error } = await supabase.from('etudiants_officiels').insert({
      matricule: matricule.trim().toUpperCase(), prenom, nom, id_classe: parseInt(id_classe),
      numero_ordre: numero_ordre ? parseInt(numero_ordre) : null, cenou, date_naissance, lieu_naissance, passage, amphi
    }).select().single();
    if (error) throw error;
    res.status(201).json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function updateEtudiant(req, res, next) {
  try {
    const { prenom, nom, id_classe, numero_ordre, cenou, date_naissance, lieu_naissance, passage, amphi } = req.body;
    const { data, error } = await supabase.from('etudiants_officiels').update({
      prenom, nom, id_classe: parseInt(id_classe), numero_ordre, cenou, date_naissance, lieu_naissance, passage, amphi
    }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteEtudiant(req, res, next) {
  try {
    await supabase.from('etudiants_officiels').delete().eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function toggleCompte(req, res, next) {
  try {
    const { action } = req.body; // 'activate' | 'deactivate' | 'delete'
    const id_etudiant = parseInt(req.params.id);

    if (action === 'delete') {
      const { data: compte } = await supabase.from('comptes_etudiants').select('photo_profil').eq('id_etudiant', id_etudiant).single();
      if (compte?.photo_profil) await deleteFromStorage(compte.photo_profil);
      await supabase.from('comptes_etudiants').update({ supprime: true, actif: false }).eq('id_etudiant', id_etudiant);
    } else {
      await supabase.from('comptes_etudiants').update({ actif: action === 'activate' }).eq('id_etudiant', id_etudiant);
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function importEtudiants(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Fichier Excel requis' });
    const { id_classe } = req.body;
    if (!id_classe) return res.status(400).json({ ok: false, message: 'Classe requise' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    let imported = 0, skipped = 0;
    for (const row of rows) {
      const matricule = String(row['Matricule'] || row['matricule'] || '').trim().toUpperCase();
      const prenom    = String(row['Prénom']   || row['prenom']   || row['Prenom']   || '').trim();
      const nom       = String(row['Nom']      || row['nom']      || '').trim();
      if (!matricule || !prenom || !nom) { skipped++; continue; }

      const { error } = await supabase.from('etudiants_officiels').upsert({
        matricule, prenom, nom,
        id_classe: parseInt(id_classe),
        numero_ordre: parseInt(row['N°'] || row['Numéro'] || row['numero_ordre'] || 0) || null,
        cenou: String(row['Cenou'] || row['cenou'] || '').trim() || null,
        date_naissance: String(row['Date naissance'] || row['date_naissance'] || '').trim() || null,
        lieu_naissance: String(row['Lieu naissance'] || row['lieu_naissance'] || '').trim() || null,
        passage: String(row['Passage'] || row['passage'] || '').trim() || null,
        amphi:   String(row['Amphi']   || row['amphi']   || '').trim() || null,
      }, { onConflict: 'matricule' });

      if (error) skipped++;
      else imported++;
    }

    const fileUrl = await uploadToStorage(req.file.buffer, 'imports/etudiants', req.file.originalname, req.file.mimetype);
    await supabase.from('imports_etudiants').insert({ id_classe: parseInt(id_classe), fichier: fileUrl });

    res.json({ ok: true, message: `Import terminé: ${imported} étudiants, ${skipped} ignorés` });
  } catch (e) { next(e); }
}

export async function exportEtudiants(req, res, next) {
  try {
    const { id_classe } = req.query;
    let query = supabase.from('etudiants_officiels').select('numero_ordre, matricule, prenom, nom, cenou, date_naissance, lieu_naissance, passage, amphi, classes(nom_classe)').order('numero_ordre');
    if (id_classe) query = query.eq('id_classe', parseInt(id_classe));
    const { data, error } = await query;
    if (error) throw error;

    const rows = data.map(e => ({
      'N°': e.numero_ordre, 'Matricule': e.matricule, 'Prénom': e.prenom, 'Nom': e.nom,
      'Cenou': e.cenou, 'Date naissance': e.date_naissance, 'Lieu naissance': e.lieu_naissance,
      'Passage': e.passage, 'Amphi': e.amphi, 'Classe': e.classes?.nom_classe
    }));

    const wb   = xlsx.utils.book_new();
    const ws   = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, 'Étudiants');
    const buf  = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="etudiants.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) { next(e); }
}

export async function deleteImport(req, res, next) {
  try {
    const { data: imp } = await supabase.from('imports_etudiants').select('fichier, id_classe').eq('id', req.params.id).single();
    if (imp?.fichier) await deleteFromStorage(imp.fichier);
    // Supprimer les étudiants importés via ce fichier si souhaité (optionnel — non destructif par défaut)
    await supabase.from('imports_etudiants').delete().eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}
