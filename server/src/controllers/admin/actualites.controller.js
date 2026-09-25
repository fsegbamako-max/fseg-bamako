import { supabase } from '../../config/supabase.js';
import { uploadToStorage, deleteFromStorage, getFileType } from '../../services/storage.service.js';

export async function listActualites(req, res, next) {
  try {
    const { data, error } = await supabase.from('actualites').select('*, fichiers_actualites(*)').order('date_publication', { ascending: false });
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function createActualite(req, res, next) {
  try {
    const { titre, contenu, categorie } = req.body;
    if (!titre) return res.status(400).json({ ok: false, message: 'Titre requis' });
    const { data: actu, error } = await supabase.from('actualites').insert({ titre, contenu, categorie: categorie || 'Général' }).select().single();
    if (error) throw error;
    const uploaded = [];
    for (const file of (req.files || [])) {
      const url  = await uploadToStorage(file.buffer, 'actualites', file.originalname, file.mimetype);
      const type = getFileType(file.mimetype);
      const { data: f } = await supabase.from('fichiers_actualites').insert({ actualite_id: actu.id, fichier: url, type_fichier: type }).select().single();
      uploaded.push(f);
    }
    res.status(201).json({ ok: true, data: { ...actu, fichiers_actualites: uploaded } });
  } catch (e) { next(e); }
}

export async function updateActualite(req, res, next) {
  try {
    const { titre, contenu, categorie } = req.body;
    const { data, error } = await supabase.from('actualites').update({ titre, contenu, categorie }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteActualite(req, res, next) {
  try {
    const { data: fichiers } = await supabase.from('fichiers_actualites').select('fichier').eq('actualite_id', req.params.id);
    for (const f of (fichiers || [])) await deleteFromStorage(f.fichier);
    await supabase.from('actualites').delete().eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function addFile(req, res, next) {
  try {
    const actualite_id = parseInt(req.params.id);
    const uploaded = [];
    for (const file of (req.files || [])) {
      const url  = await uploadToStorage(file.buffer, 'actualites', file.originalname, file.mimetype);
      const type = getFileType(file.mimetype);
      const { data: f } = await supabase.from('fichiers_actualites').insert({ actualite_id, fichier: url, type_fichier: type }).select().single();
      uploaded.push(f);
    }
    res.json({ ok: true, fichiers: uploaded });
  } catch (e) { next(e); }
}

export async function deleteFile(req, res, next) {
  try {
    const { data: f } = await supabase.from('fichiers_actualites').select('fichier').eq('id', req.params.fileId).single();
    if (f) await deleteFromStorage(f.fichier);
    await supabase.from('fichiers_actualites').delete().eq('id', req.params.fileId);
    res.json({ ok: true });
  } catch (e) { next(e); }
}
