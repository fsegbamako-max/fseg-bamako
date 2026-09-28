import bcrypt from 'bcryptjs';
import { supabase } from '../../config/supabase.js';
import { uploadToStorage, deleteFromStorage, createStorageSignedUrl } from '../../services/storage.service.js';
import xlsx from 'xlsx';
import { normalizeStudentDate, normalizeStudentOrder, normalizeStudentRow } from '../../utils/studentData.js';

const requiredImportFields = {
  numero_ordre: 'Numéro d’ordre (numero_ordre)',
  matricule: 'Matricule',
  cenou: 'Cenou',
  prenom: 'Prénom (prenom)',
  nom: 'Nom',
  date_naissance: 'Date de naissance (date_naissance)',
  lieu_naissance: 'Lieu de naissance (lieu_naissance)',
  passage: 'Passage',
  amphi: 'Amphi'
};

export async function listEtudiants(req, res, next) {
  try {
    const { id_classe, search, page = 1, limit = 50 } = req.query;
    const from = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('etudiants_officiels')
      .select('id, matricule, prenom, nom, numero_ordre, cenou, date_naissance, lieu_naissance, passage, amphi, id_classe, classes(nom_classe)', { count: 'exact' })
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
      numero_ordre: normalizeStudentOrder(numero_ordre), cenou, date_naissance, lieu_naissance, passage, amphi
    }).select().single();
    if (error) throw error;
    res.status(201).json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function updateEtudiant(req, res, next) {
  try {
    const {
      prenom, nom, id_classe, numero_ordre, cenou, date_naissance,
      lieu_naissance, passage, amphi, telephone, nouveau_mot_de_passe
    } = req.body;
    const id = parseInt(req.params.id, 10);
    const hasAccountUpdates = telephone !== undefined || Boolean(nouveau_mot_de_passe) || Boolean(req.file);
    let compte = null;

    if (telephone !== undefined) {
      if (typeof telephone !== 'string' || (telephone.trim() && !/^[0-9]{8}$/.test(telephone.trim()))) {
        return res.status(400).json({ ok: false, message: 'Numéro de téléphone invalide (8 chiffres requis)' });
      }
    }
    if (nouveau_mot_de_passe) {
      if (typeof nouveau_mot_de_passe !== 'string' || nouveau_mot_de_passe.length < 6 || Buffer.byteLength(nouveau_mot_de_passe, 'utf8') > 72) {
        return res.status(400).json({ ok: false, message: 'Le mot de passe doit contenir au moins 6 caractères (72 octets maximum)' });
      }
    }

    if (hasAccountUpdates) {
      const { data, error: compteError } = await supabase
        .from('comptes_etudiants')
        .select('id, photo_profil')
        .eq('id_etudiant', id)
        .maybeSingle();
      if (compteError) throw compteError;
      if (!data) return res.status(404).json({ ok: false, message: 'Aucun compte étudiant associé à cette fiche' });
      compte = data;
    }

    const { data, error } = await supabase.from('etudiants_officiels').update({
      prenom, nom, id_classe: parseInt(id_classe), numero_ordre: normalizeStudentOrder(numero_ordre), cenou, date_naissance, lieu_naissance, passage, amphi
    }).eq('id', id).select().single();
    if (error) throw error;

    if (hasAccountUpdates) {
      const accountUpdates = { updated_at: new Date().toISOString() };
      if (telephone !== undefined) accountUpdates.telephone = telephone.trim() || null;
      if (nouveau_mot_de_passe) accountUpdates.mot_de_passe = await bcrypt.hash(nouveau_mot_de_passe, 12);

      let photoUrl;
      if (req.file) {
        photoUrl = await uploadToStorage(req.file.buffer, 'profils', req.file.originalname, req.file.mimetype);
        accountUpdates.photo_profil = photoUrl;
      }

      const { data: updatedCompte, error: updateCompteError } = await supabase
        .from('comptes_etudiants')
        .update(accountUpdates)
        .eq('id_etudiant', id)
        .select('id')
        .maybeSingle();
      if (updateCompteError || !updatedCompte) {
        if (photoUrl) await deleteFromStorage(photoUrl);
        if (updateCompteError) throw updateCompteError;
        return res.status(404).json({ ok: false, message: 'Compte étudiant introuvable' });
      }
      if (photoUrl && compte.photo_profil) await deleteFromStorage(compte.photo_profil);
    }

    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteEtudiant(req, res, next) {
  try {
    const { data: comptes, error: comptesError } = await supabase
      .from('comptes_etudiants')
      .select('photo_profil')
      .eq('id_etudiant', req.params.id);
    if (comptesError) throw comptesError;
    for (const compte of comptes || []) {
      if (compte.photo_profil) await deleteFromStorage(compte.photo_profil);
    }

    const { data, error } = await supabase
      .from('etudiants_officiels')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ ok: false, message: 'Étudiant introuvable' });
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

export async function listImports(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('imports_etudiants')
      .select('id, id_classe, fichier, type_fichier, nom_fichier, type_liste, date_import, classes(nom_classe)')
      .order('date_import', { ascending: false });
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function trackLegacyImport(importRecord) {
  if (importRecord.suivi_active) return;

  const matricules = new Set();
  if (importRecord.fichier) {
    const signedUrl = await createStorageSignedUrl(importRecord.fichier);
    if (!signedUrl) throw new Error('Fichier d’import introuvable');
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error('Impossible de lire le fichier de cet ancien import');
    const workbook = xlsx.read(Buffer.from(await response.arrayBuffer()), { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    for (const row of xlsx.utils.sheet_to_json(sheet, { defval: '' })) {
      const value = normalizeStudentRow(row).matricule;
      if (value) matricules.add(String(value).trim().toUpperCase());
    }
  }

  const values = [...matricules];
  for (let index = 0; index < values.length; index += 200) {
    const { data: students, error } = await supabase
      .from('etudiants_officiels')
      .select('id')
      .eq('id_classe', importRecord.id_classe)
      .in('matricule', values.slice(index, index + 200));
    if (error) throw error;
    if (students?.length) {
      const { error: linkError } = await supabase
        .from('imports_etudiants_lignes')
        .upsert(students.map(student => ({ id_import: importRecord.id, id_etudiant: student.id })), {
          onConflict: 'id_import,id_etudiant',
          ignoreDuplicates: true
        });
      if (linkError) throw linkError;
    }
  }

  const { error } = await supabase
    .from('imports_etudiants')
    .update({ suivi_active: true })
    .eq('id', importRecord.id);
  if (error) throw error;
}

export async function listImportStudents(req, res, next) {
  try {
    const importId = Number(req.params.id);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    if (!Number.isInteger(importId) || importId < 1) {
      return res.status(400).json({ ok: false, message: 'Identifiant d’import invalide' });
    }

    const { data: importRecord, error: importError } = await supabase
      .from('imports_etudiants')
      .select('id, id_classe, fichier, nom_fichier, type_liste, date_import, suivi_active, classes(nom_classe)')
      .eq('id', importId)
      .maybeSingle();
    if (importError) throw importError;
    if (!importRecord) return res.status(404).json({ ok: false, message: 'Import introuvable' });

    await trackLegacyImport(importRecord);
    const from = (page - 1) * limit;
    const { data: links, error, count } = await supabase
      .from('imports_etudiants_lignes')
      .select('id_etudiant, etudiants_officiels(id, matricule, prenom, nom, numero_ordre, cenou, date_naissance, lieu_naissance, passage, amphi, classes(nom_classe))', { count: 'exact' })
      .eq('id_import', importId)
      .order('id_etudiant')
      .range(from, from + limit - 1);
    if (error) throw error;

    res.json({
      ok: true,
      data: (links || []).map(link => link.etudiants_officiels).filter(Boolean),
      total: count || 0,
      page,
      limit,
      import: importRecord
    });
  } catch (e) { next(e); }
}

export async function importEtudiants(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Fichier Excel requis' });
    const { id_classe, type_liste = 'partielle' } = req.body;
    if (!id_classe) return res.status(400).json({ ok: false, message: 'Classe requise' });
    if (!['partielle', 'complete'].includes(type_liste)) {
      return res.status(400).json({ ok: false, message: 'Type de liste invalide' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    const headers = normalizeStudentRow(Object.fromEntries(Object.keys(rows[0] || {}).map(header => [header, true])));
    const missingFields = Object.keys(requiredImportFields).filter(field => headers[field] === undefined);
    if (missingFields.length) {
      const missingColumns = missingFields.map(field => requiredImportFields[field]);
      return res.status(400).json({
        ok: false,
        message: `Import annulé. Colonnes obligatoires manquantes : ${missingColumns.join(', ')}. Aucune donnée n’a été modifiée.`,
        missingColumns
      });
    }

    const classId = Number.parseInt(id_classe, 10);
    if (!Number.isInteger(classId) || classId < 1) {
      return res.status(400).json({ ok: false, message: 'Classe invalide' });
    }

    const fileUrl = await uploadToStorage(req.file.buffer, 'imports/etudiants', req.file.originalname, req.file.mimetype);
    const { data: importRecord, error: importError } = await supabase
      .from('imports_etudiants')
      .insert({
        id_classe: classId,
        fichier: fileUrl,
        type_fichier: req.file.mimetype,
        nom_fichier: req.file.originalname,
        type_liste,
        suivi_active: true
      })
      .select('id')
      .single();
    if (importError) {
      await deleteFromStorage(fileUrl);
      throw importError;
    }

    let skipped = 0;
    const studentsByMatricule = new Map();
    for (const row of rows) {
      const values = normalizeStudentRow(row);
      const matricule = String(values.matricule || '').trim().toUpperCase();
      const prenom = String(values.prenom || '').trim();
      const nom = String(values.nom || '').trim();
      if (!matricule || !prenom || !nom || studentsByMatricule.has(matricule)) { skipped++; continue; }

      const student = { matricule, prenom, nom, id_classe: classId };
      if (values.numero_ordre !== undefined) student.numero_ordre = normalizeStudentOrder(values.numero_ordre);
      if (values.cenou !== undefined) student.cenou = String(values.cenou).trim() || null;
      if (values.date_naissance !== undefined) {
        const rawDate = String(values.date_naissance ?? '').trim();
        student.date_naissance = normalizeStudentDate(values.date_naissance);
        if (rawDate && !student.date_naissance) { skipped++; continue; }
      }
      if (values.lieu_naissance !== undefined) student.lieu_naissance = String(values.lieu_naissance).trim() || null;
      if (values.passage !== undefined) student.passage = String(values.passage).trim() || null;
      if (values.amphi !== undefined) student.amphi = String(values.amphi).trim() || null;
      studentsByMatricule.set(matricule, student);
    }

    const students = [...studentsByMatricule.values()];
    const importedMatricules = new Set();
    for (let index = 0; index < students.length; index += 250) {
      const { data: inserted, error } = await supabase
        .from('etudiants_officiels')
        .upsert(students.slice(index, index + 250), { onConflict: 'matricule', ignoreDuplicates: true })
        .select('id, matricule');
      if (error) throw error;
      for (const student of inserted || []) importedMatricules.add(student.matricule);
    }

    const matricules = [...studentsByMatricule.keys()];
    const existingByMatricule = new Map();
    for (let index = 0; index < matricules.length; index += 250) {
      const { data: existing, error } = await supabase
        .from('etudiants_officiels')
        .select('id, matricule')
        .eq('id_classe', classId)
        .in('matricule', matricules.slice(index, index + 250));
      if (error) throw error;
      for (const student of existing || []) existingByMatricule.set(student.matricule, student.id);
    }

    const links = matricules
      .map(matricule => ({ id_import: importRecord.id, id_etudiant: existingByMatricule.get(matricule) }))
      .filter(link => {
        if (link.id_etudiant) return true;
        skipped++;
        return false;
      });

    for (let index = 0; index < links.length; index += 250) {
      const { error } = await supabase
        .from('imports_etudiants_lignes')
        .upsert(links.slice(index, index + 250), {
          onConflict: 'id_import,id_etudiant',
          ignoreDuplicates: true
        });
      if (error) throw error;
    }

    const imported = importedMatricules.size;
    const alreadyPresent = links.length - imported;

    res.json({
      ok: true,
      import_id: importRecord.id,
      message: `Import terminé : ${imported} ajoutés, ${alreadyPresent} déjà présents dans cette classe, ${skipped} doublons ou lignes ignorés`
    });
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
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ ok: false, message: 'Identifiant d’import invalide' });
    const result = await removeImports([id]);
    if (!result.deleted) return res.status(404).json({ ok: false, message: 'Import introuvable' });
    res.json({ ok: true, deleted: result.deleted });
  } catch (e) { next(e); }
}

export async function deleteImports(req, res, next) {
  try {
    const rawIds = req.body?.ids;
    if (!Array.isArray(rawIds) || !rawIds.length || rawIds.some(id => !Number.isInteger(Number(id)) || Number(id) < 1)) {
      return res.status(400).json({ ok: false, message: 'Sélectionnez au moins un import valide' });
    }
    const result = await removeImports([...new Set(rawIds.map(Number))]);
    res.json({ ok: true, deleted: result.deleted });
  } catch (e) { next(e); }
}

async function removeImports(ids) {
  const { data: imports, error: readError } = await supabase
    .from('imports_etudiants')
    .select('id, fichier')
    .in('id', ids);
  if (readError) throw readError;
  if (!imports?.length) return { deleted: 0 };

  for (const item of imports) {
    if (item.fichier) await deleteFromStorage(item.fichier);
  }
  const { error } = await supabase.from('imports_etudiants').delete().in('id', imports.map(item => item.id));
  if (error) throw error;
  return { deleted: imports.length };
}
