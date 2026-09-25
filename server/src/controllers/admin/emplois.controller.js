import { supabase } from '../../config/supabase.js';
import { uploadToStorage, deleteFromStorage, getFileType } from '../../services/storage.service.js';

export async function listEmplois(req, res, next) {
  try {
    const id_classe = req.query.id_classe ? parseInt(req.query.id_classe) : null;
    let query = supabase
      .from('emplois')
      .select('id, titre, description, id_classe, created_at, fichiers_emplois(id, fichier, type_fichier, is_pinned), classes(nom_classe)')
      .order('created_at', { ascending: false });
    if (id_classe) query = query.eq('id_classe', id_classe);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function createEmploi(req, res, next) {
  try {
    const { titre, description, id_classe, is_pinned } = req.body;
    if (!titre || !id_classe) return res.status(400).json({ ok: false, message: 'Titre et classe requis' });
    const { data: pub, error } = await supabase.from('emplois').insert({ titre, description, id_classe: parseInt(id_classe) }).select().single();
    if (error) throw error;

    // Si épinglé, dépingler les autres
    if (is_pinned === 'true' || is_pinned === true) {
      await supabase.from('fichiers_emplois')
        .update({ is_pinned: false })
        .in('emploi_id', (await supabase.from('emplois').select('id').eq('id_classe', parseInt(id_classe))).data?.map(e => e.id) || []);
    }

    const uploaded = [];
    for (let i = 0; i < (req.files || []).length; i++) {
      const file     = req.files[i];
      const url      = await uploadToStorage(file.buffer, 'emplois', file.originalname, file.mimetype);
      const type     = getFileType(file.mimetype);
      const pinned   = i === 0 && (is_pinned === 'true' || is_pinned === true);
      const { data: f } = await supabase.from('fichiers_emplois').insert({ emploi_id: pub.id, fichier: url, type_fichier: type, is_pinned: pinned }).select().single();
      uploaded.push(f);
    }
    res.status(201).json({ ok: true, data: { ...pub, fichiers_emplois: uploaded } });
  } catch (e) { next(e); }
}

export async function updateEmploi(req, res, next) {
  try {
    const { titre, description } = req.body;
    const { data, error } = await supabase.from('emplois').update({ titre, description }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteEmploi(req, res, next) {
  try {
    const { data: fichiers } = await supabase.from('fichiers_emplois').select('fichier').eq('emploi_id', req.params.id);
    for (const f of (fichiers || [])) await deleteFromStorage(f.fichier);
    await supabase.from('emplois').delete().eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function addFile(req, res, next) {
  try {
    const emploi_id = parseInt(req.params.id);
    const { is_pinned } = req.body;
    const uploaded = [];
    for (let i = 0; i < (req.files || []).length; i++) {
      const file   = req.files[i];
      const url    = await uploadToStorage(file.buffer, 'emplois', file.originalname, file.mimetype);
      const type   = getFileType(file.mimetype);
      const pinned = is_pinned === 'true' && i === 0;
      const { data: f } = await supabase.from('fichiers_emplois').insert({ emploi_id, fichier: url, type_fichier: type, is_pinned: pinned }).select().single();
      uploaded.push(f);
    }
    res.json({ ok: true, fichiers: uploaded });
  } catch (e) { next(e); }
}

export async function updateFile(req, res, next) {
  try {
    const updates = {};
    if (req.file) {
      const { data: old } = await supabase.from('fichiers_emplois').select('fichier').eq('id', req.params.fileId).single();
      if (old) await deleteFromStorage(old.fichier);
      updates.fichier      = await uploadToStorage(req.file.buffer, 'emplois', req.file.originalname, req.file.mimetype);
      updates.type_fichier = getFileType(req.file.mimetype);
    }
    if (req.body.is_pinned !== undefined) updates.is_pinned = req.body.is_pinned === 'true';
    const { data, error } = await supabase.from('fichiers_emplois').update(updates).eq('id', req.params.fileId).select().single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteFile(req, res, next) {
  try {
    const { data: f } = await supabase.from('fichiers_emplois').select('fichier').eq('id', req.params.fileId).single();
    if (f) await deleteFromStorage(f.fichier);
    await supabase.from('fichiers_emplois').delete().eq('id', req.params.fileId);
    res.json({ ok: true });
  } catch (e) { next(e); }
}
