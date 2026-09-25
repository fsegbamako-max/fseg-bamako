import { supabase } from '../../config/supabase.js';
import { uploadToStorage, deleteFromStorage, getFileType } from '../../services/storage.service.js';
import xlsx from 'xlsx';

// ─── Publications de documents de résultats ────────────────────────────────

export async function listNotes(req, res, next) {
  try {
    const id_classe = req.query.id_classe ? parseInt(req.query.id_classe) : null;
    let query = supabase
      .from('notes')
      .select('id, titre, description, id_classe, created_at, fichiers_notes(id, fichier, type_fichier), classes(nom_classe)')
      .order('created_at', { ascending: false });
    if (id_classe) query = query.eq('id_classe', id_classe);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function createNote(req, res, next) {
  try {
    const { titre, description, id_classe } = req.body;
    if (!titre || !id_classe) return res.status(400).json({ ok: false, message: 'Titre et classe requis' });
    const { data: pub, error } = await supabase.from('notes').insert({ titre, description, id_classe: parseInt(id_classe) }).select().single();
    if (error) throw error;
    const uploaded = [];
    for (const file of (req.files || [])) {
      const url  = await uploadToStorage(file.buffer, 'notes', file.originalname, file.mimetype);
      const type = getFileType(file.mimetype);
      const { data: f } = await supabase.from('fichiers_notes').insert({ note_id: pub.id, fichier: url, type_fichier: type }).select().single();
      uploaded.push(f);
    }
    res.status(201).json({ ok: true, data: { ...pub, fichiers_notes: uploaded } });
  } catch (e) { next(e); }
}

export async function updateNote(req, res, next) {
  try {
    const { titre, description } = req.body;
    const { data, error } = await supabase.from('notes').update({ titre, description }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteNote(req, res, next) {
  try {
    const { data: fichiers } = await supabase.from('fichiers_notes').select('fichier').eq('note_id', req.params.id);
    for (const f of (fichiers || [])) await deleteFromStorage(f.fichier);
    await supabase.from('notes').delete().eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function addFile(req, res, next) {
  try {
    const note_id  = parseInt(req.params.id);
    const uploaded = [];
    for (const file of (req.files || [])) {
      const url  = await uploadToStorage(file.buffer, 'notes', file.originalname, file.mimetype);
      const type = getFileType(file.mimetype);
      const { data: f } = await supabase.from('fichiers_notes').insert({ note_id, fichier: url, type_fichier: type }).select().single();
      uploaded.push(f);
    }
    res.json({ ok: true, fichiers: uploaded });
  } catch (e) { next(e); }
}

export async function updateFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Fichier requis' });
    const { data: old } = await supabase.from('fichiers_notes').select('fichier').eq('id', req.params.fileId).single();
    if (old) await deleteFromStorage(old.fichier);
    const url  = await uploadToStorage(req.file.buffer, 'notes', req.file.originalname, req.file.mimetype);
    const type = getFileType(req.file.mimetype);
    const { data, error } = await supabase.from('fichiers_notes').update({ fichier: url, type_fichier: type }).eq('id', req.params.fileId).select().single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteFile(req, res, next) {
  try {
    const { data: f } = await supabase.from('fichiers_notes').select('fichier').eq('id', req.params.fileId).single();
    if (f) await deleteFromStorage(f.fichier);
    await supabase.from('fichiers_notes').delete().eq('id', req.params.fileId);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

// ─── Import Excel de notes individuelles ──────────────────────────────────

export async function importNotes(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Fichier Excel requis' });
    const { id_classe, id_semestre } = req.body;
    if (!id_classe || !id_semestre) return res.status(400).json({ ok: false, message: 'Classe et semestre requis' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = xlsx.utils.sheet_to_json(sheet, { defval: null });

    if (!rows.length) return res.status(400).json({ ok: false, message: 'Fichier vide ou invalide' });

    // Uploader le fichier source
    const fileUrl = await uploadToStorage(req.file.buffer, 'imports/notes', req.file.originalname, req.file.mimetype);
    const { data: imp } = await supabase.from('imports_notes').insert({ id_classe: parseInt(id_classe), id_semestre: parseInt(id_semestre), fichier: fileUrl }).select().single();

    // Colonnes = matières (sauf 'matricule' / 'Matricule')
    const headers   = Object.keys(rows[0]).filter(h => !/^(matricule|n[°uo]|num[ée]ro)/i.test(h));
    const matiereMap = {};

    for (const col of headers) {
      const { data: mat } = await supabase.from('matieres').insert({
        id_import: imp.id, id_classe: parseInt(id_classe), id_semestre: parseInt(id_semestre),
        code_colonne: col, nom_matiere: col
      }).select().single();
      if (mat) matiereMap[col] = mat.id;
    }

    // Insérer les notes
    const matriculeCol = Object.keys(rows[0]).find(h => /^(matricule)/i.test(h)) || Object.keys(rows[0])[0];
    let imported = 0, errors = 0;

    for (const row of rows) {
      const matricule = String(row[matriculeCol] || '').trim().toUpperCase();
      if (!matricule) continue;

      const { data: eo } = await supabase.from('etudiants_officiels').select('id').eq('matricule', matricule).single();
      if (!eo) { errors++; continue; }

      for (const col of headers) {
        if (!(col in matiereMap)) continue;
        const note = parseFloat(row[col]);
        if (isNaN(note)) continue;
        await supabase.from('notes_etudiants').upsert({
          id_etudiant: eo.id, id_matiere: matiereMap[col], note
        }, { onConflict: 'id_etudiant,id_matiere' });
        imported++;
      }
    }

    res.json({ ok: true, message: `Import terminé: ${imported} notes importées, ${errors} matricules inconnus` });
  } catch (e) { next(e); }
}

export async function listImports(req, res, next) {
  try {
    const { data, error } = await supabase.from('imports_notes').select('*, classes(nom_classe), semestres(numero)').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteImport(req, res, next) {
  try {
    const { data: imp } = await supabase.from('imports_notes').select('id, fichier').eq('id', req.params.id).single();
    if (imp?.fichier) await deleteFromStorage(imp.fichier);
    // Supprimer les matières et notes associées (CASCADE en DB)
    await supabase.from('imports_notes').delete().eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}
