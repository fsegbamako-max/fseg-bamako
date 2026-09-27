import { supabase } from '../../config/supabase.js';
import { uploadToStorage, deleteFromStorage, getFileType } from '../../services/storage.service.js';
import { normalizeStudentOrder, normalizeStudentRow } from '../../utils/studentData.js';
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

function analyzeNotesWorkbook(buffer, identityColumnCount) {
  const identityColumns = Number.parseInt(identityColumnCount, 10);
  if (![6, 7].includes(identityColumns)) {
    throw new Error('Choisissez 6 ou 7 colonnes d’identité avant les matières');
  }

  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  if (rows.length < 2) throw new Error('Le fichier doit contenir une ligne d’en-tête et au moins une ligne étudiant');

  const headers = rows[0].map(value => String(value ?? '').trim());
  if (headers.length <= identityColumns) throw new Error(`Aucune matière détectée après les ${identityColumns} colonnes d’identité`);

  const identityHeaders = Object.fromEntries(headers.slice(0, identityColumns).map((header, index) => [header, index]));
  const identifiers = normalizeStudentRow(identityHeaders);
  const matriculeColumn = Number.isInteger(identifiers.matricule) ? identifiers.matricule : null;
  const orderColumn = Number.isInteger(identifiers.numero_ordre) ? identifiers.numero_ordre : null;
  const detectedMatriculeColumn = matriculeColumn ?? (orderColumn === null && identityColumns >= 2 ? 1 : null);
  if (detectedMatriculeColumn === null && orderColumn === null) {
    throw new Error('Impossible de détecter le matricule ou le numéro d’ordre dans les colonnes d’identité');
  }

  const subjects = headers.slice(identityColumns).map((header, index) => ({
    columnIndex: identityColumns + index,
    position: index + 1,
    header: header || `Colonne ${identityColumns + index + 1}`,
    samples: rows.slice(1, 5).map(row => String(row[identityColumns + index] ?? '').trim())
  }));

  return {
    rows,
    identityColumns,
    matriculeColumn: detectedMatriculeColumn,
    orderColumn,
    subjects
  };
}

export async function previewNotesImport(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Fichier Excel requis' });
    const analysis = analyzeNotesWorkbook(req.file.buffer, req.body.identity_columns);
    res.json({
      ok: true,
      data: {
        identity_columns: analysis.identityColumns,
        identifier_type: analysis.orderColumn !== null && analysis.matriculeColumn === null ? 'numero_ordre' : 'matricule',
        subjects: analysis.subjects
      }
    });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message || 'Impossible d’analyser le fichier' });
  }
}

export async function importNotes(req, res, next) {
  let importId = null;
  let fileUrl = null;
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Fichier Excel requis' });
    const { id_classe, id_semestre } = req.body;
    if (!id_classe || !id_semestre) return res.status(400).json({ ok: false, message: 'Classe et semestre requis' });
    const classId = parseInt(id_classe, 10);
    const semesterId = parseInt(id_semestre, 10);
    if (!Number.isInteger(classId) || !Number.isInteger(semesterId)) {
      return res.status(400).json({ ok: false, message: 'Classe ou semestre invalide' });
    }

    let subjectNames;
    try { subjectNames = JSON.parse(req.body.subject_names || '[]'); }
    catch { return res.status(400).json({ ok: false, message: 'Les noms de matières sont invalides' }); }
    if (!Array.isArray(subjectNames) || subjectNames.some(name => typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ ok: false, message: 'Saisissez le nom de chaque matière détectée' });
    }

    const analysis = analyzeNotesWorkbook(req.file.buffer, req.body.identity_columns);
    if (subjectNames.length !== analysis.subjects.length) {
      return res.status(400).json({ ok: false, message: `Le fichier contient ${analysis.subjects.length} matières; relancez son analyse puis nommez-les toutes` });
    }

    const { data: previousImports, error: previousImportsError } = await supabase
      .from('imports_notes')
      .select('id, fichier')
      .eq('id_classe', classId)
      .eq('id_semestre', semesterId);
    if (previousImportsError) throw previousImportsError;

    fileUrl = await uploadToStorage(req.file.buffer, 'imports/notes', req.file.originalname, req.file.mimetype);
    const { data: imp, error: importError } = await supabase.from('imports_notes').insert({
      id_classe: classId,
      id_semestre: semesterId,
      fichier: fileUrl
    }).select().single();
    if (importError) throw importError;
    importId = imp.id;

    const subjectsToInsert = analysis.subjects.map((subject, index) => ({
      id_import: imp.id,
      id_classe: classId,
      id_semestre: semesterId,
      code_colonne: String(index + 1),
      nom_matiere: subjectNames[index].trim()
    }));
    const { data: savedSubjects, error: subjectsError } = await supabase
      .from('matieres')
      .insert(subjectsToInsert)
      .select('id, code_colonne');
    if (subjectsError) throw subjectsError;
    const subjectIds = new Map(savedSubjects.map(subject => [Number(subject.code_colonne), subject.id]));

    const matricules = new Set();
    const orders = new Set();
    for (const row of analysis.rows.slice(1)) {
      const matricule = analysis.matriculeColumn === null ? '' : String(row[analysis.matriculeColumn] ?? '').trim().toUpperCase();
      const order = analysis.orderColumn === null ? '' : normalizeStudentOrder(row[analysis.orderColumn]);
      if (matricule) matricules.add(matricule);
      else if (order) orders.add(order);
    }

    const studentIds = new Map();
    const lookupStudents = async (field, values, prefix) => {
      const list = [...values];
      for (let index = 0; index < list.length; index += 250) {
        const { data, error } = await supabase
          .from('etudiants_officiels')
          .select(`id, ${field}`)
          .eq('id_classe', classId)
          .in(field, list.slice(index, index + 250));
        if (error) throw error;
        for (const student of data || []) {
          const identifier = field === 'numero_ordre'
            ? normalizeStudentOrder(student[field])
            : String(student[field]).trim().toUpperCase();
          studentIds.set(`${prefix}:${identifier}`, student.id);
        }
      }
    };
    await lookupStudents('matricule', matricules, 'M');
    await lookupStudents('numero_ordre', orders, 'O');

    const notesByStudentAndSubject = new Map();
    let unknownStudents = 0, invalidNotes = 0;
    for (const row of analysis.rows.slice(1)) {
      const matricule = analysis.matriculeColumn === null ? '' : String(row[analysis.matriculeColumn] ?? '').trim().toUpperCase();
      const order = analysis.orderColumn === null ? '' : normalizeStudentOrder(row[analysis.orderColumn]);
      if (!matricule && !order) continue;
      const studentId = matricule
        ? studentIds.get(`M:${matricule}`)
        : studentIds.get(`O:${String(order).trim().toUpperCase()}`);
      if (!studentId) { unknownStudents++; continue; }

      for (const subject of analysis.subjects) {
        const rawNote = String(row[subject.columnIndex] ?? '').trim();
        if (!rawNote) continue;
        const note = Number(rawNote.replace(',', '.'));
        if (!Number.isFinite(note) || note < 0 || note > 20) { invalidNotes++; continue; }
        const subjectId = subjectIds.get(subject.position);
        notesByStudentAndSubject.set(`${studentId}:${subjectId}`, {
          id_etudiant: studentId,
          id_matiere: subjectId,
          note
        });
      }
    }

    const noteRows = [...notesByStudentAndSubject.values()];
    for (let index = 0; index < noteRows.length; index += 500) {
      const { error } = await supabase
        .from('notes_etudiants')
        .upsert(noteRows.slice(index, index + 500), { onConflict: 'id_etudiant,id_matiere' });
      if (error) throw error;
    }
    const imported = noteRows.length;

    if (!imported) {
      const { error: cleanupError } = await supabase.from('imports_notes').delete().eq('id', imp.id);
      if (cleanupError) throw cleanupError;
      importId = null;
      await deleteFromStorage(fileUrl);
      fileUrl = null;
      return res.status(422).json({
        ok: false,
        message: `Aucune note importée. Vérifiez les identifiants et les notes entre 0 et 20. ${unknownStudents} étudiant(s) introuvable(s), ${invalidNotes} note(s) invalide(s). L’ancien relevé a été conservé.`
      });
    }

    for (const previousImport of previousImports || []) {
      const { error: deleteError } = await supabase.from('imports_notes').delete().eq('id', previousImport.id);
      if (deleteError) throw deleteError;
      if (previousImport.fichier) await deleteFromStorage(previousImport.fichier);
    }

    res.json({
      ok: true,
      message: `Import réussi : ${imported} note(s) enregistrée(s), ${unknownStudents} étudiant(s) introuvable(s), ${invalidNotes} note(s) invalide(s) ignorée(s)`
    });
  } catch (e) {
    if (importId) await supabase.from('imports_notes').delete().eq('id', importId);
    if (fileUrl) await deleteFromStorage(fileUrl);
    next(e);
  }
}

export async function listImports(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('imports_notes')
      .select('id, id_classe, id_semestre, fichier, created_at, classes(nom_classe), semestres(numero), matieres(id, code_colonne, nom_matiere)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function renameImportedSubject(req, res, next) {
  try {
    const importId = Number(req.params.id);
    const subjectId = Number(req.params.subjectId);
    const name = typeof req.body.nom_matiere === 'string' ? req.body.nom_matiere.trim() : '';
    if (!Number.isInteger(importId) || importId < 1 || !Number.isInteger(subjectId) || subjectId < 1) {
      return res.status(400).json({ ok: false, message: 'Identifiant d’import ou de matière invalide' });
    }
    if (!name || name.length > 120) {
      return res.status(400).json({ ok: false, message: 'Le nom de la matière doit contenir entre 1 et 120 caractères' });
    }

    const { data, error } = await supabase
      .from('matieres')
      .update({ nom_matiere: name })
      .eq('id', subjectId)
      .eq('id_import', importId)
      .select('id, code_colonne, nom_matiere')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, message: 'Matière introuvable pour cet import' });
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteImport(req, res, next) {
  try {
    const importId = Number(req.params.id);
    if (!Number.isInteger(importId) || importId < 1) {
      return res.status(400).json({ ok: false, message: 'Identifiant d’import invalide' });
    }
    const { data: imp, error: lookupError } = await supabase
      .from('imports_notes')
      .select('id, fichier')
      .eq('id', importId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!imp) return res.status(404).json({ ok: false, message: 'Import introuvable' });
    const { error } = await supabase.from('imports_notes').delete().eq('id', importId);
    if (error) throw error;
    if (imp.fichier) await deleteFromStorage(imp.fichier);
    res.json({ ok: true });
  } catch (e) { next(e); }
}
