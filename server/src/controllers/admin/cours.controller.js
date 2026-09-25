import { supabase } from '../../config/supabase.js';
import { uploadToStorage, deleteFromStorage, getFileType } from '../../services/storage.service.js';

export async function listCours(req, res, next) {
  try {
    const id_classe = req.query.id_classe ? parseInt(req.query.id_classe) : null;
    let query = supabase
      .from('cours')
      .select('id, titre, description, id_classe, created_at, fichiers_cours(id, fichier, type_fichier, created_at), classes(nom_classe)')
      .order('created_at', { ascending: false });

    if (id_classe) query = query.eq('id_classe', id_classe);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function createCours(req, res, next) {
  try {
    const { titre, description, id_classe } = req.body;
    if (!titre || !id_classe) {
      return res.status(400).json({ ok: false, message: 'Titre et classe requis' });
    }

    const { data: pub, error } = await supabase
      .from('cours')
      .insert({ titre, description, id_classe: parseInt(id_classe) })
      .select()
      .single();

    if (error) throw error;

    // Uploader les fichiers
    const uploaded = [];
    for (const file of (req.files || [])) {
      const url  = await uploadToStorage(file.buffer, 'cours', file.originalname, file.mimetype);
      const type = getFileType(file.mimetype);
      const { data: f } = await supabase.from('fichiers_cours').insert({ cours_id: pub.id, fichier: url, type_fichier: type }).select().single();
      uploaded.push(f);
    }

    res.status(201).json({ ok: true, data: { ...pub, fichiers_cours: uploaded } });
  } catch (e) { next(e); }
}

export async function updateCours(req, res, next) {
  try {
    const { titre, description } = req.body;
    const { data, error } = await supabase
      .from('cours')
      .update({ titre, description })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteCours(req, res, next) {
  try {
    // Supprimer les fichiers Supabase Storage d'abord
    const { data: fichiers } = await supabase.from('fichiers_cours').select('fichier').eq('cours_id', req.params.id);
    for (const f of (fichiers || [])) await deleteFromStorage(f.fichier);

    await supabase.from('cours').delete().eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function addFile(req, res, next) {
  try {
    const cours_id = parseInt(req.params.id);
    const uploaded = [];
    for (const file of (req.files || [])) {
      const url  = await uploadToStorage(file.buffer, 'cours', file.originalname, file.mimetype);
      const type = getFileType(file.mimetype);
      const { data: f } = await supabase.from('fichiers_cours').insert({ cours_id, fichier: url, type_fichier: type }).select().single();
      uploaded.push(f);
    }
    res.json({ ok: true, fichiers: uploaded });
  } catch (e) { next(e); }
}

export async function updateFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Fichier requis' });
    const { data: old } = await supabase.from('fichiers_cours').select('fichier').eq('id', req.params.fileId).single();
    if (old) await deleteFromStorage(old.fichier);

    const url  = await uploadToStorage(req.file.buffer, 'cours', req.file.originalname, req.file.mimetype);
    const type = getFileType(req.file.mimetype);
    const { data, error } = await supabase.from('fichiers_cours').update({ fichier: url, type_fichier: type }).eq('id', req.params.fileId).select().single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteFile(req, res, next) {
  try {
    const { data: f } = await supabase.from('fichiers_cours').select('fichier').eq('id', req.params.fileId).single();
    if (f) await deleteFromStorage(f.fichier);
    await supabase.from('fichiers_cours').delete().eq('id', req.params.fileId);
    res.json({ ok: true });
  } catch (e) { next(e); }
}
