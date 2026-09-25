import { supabase } from '../../config/supabase.js';
import { uploadToStorage, deleteFromStorage, getFileType } from '../../services/storage.service.js';

export async function listDocuments(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('publications_documents')
      .select('id, titre, description, created_at, fichiers_documents(id, fichier, type_fichier, created_at)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ ok: true, data: data || [] });
  } catch (e) { next(e); }
}

export async function createDocument(req, res, next) {
  try {
    const { titre, description } = req.body;
    if (!titre || !description || !(req.files || []).length) {
      return res.status(400).json({ ok: false, message: 'Titre, description et fichier requis' });
    }

    const { data: publication, error } = await supabase
      .from('publications_documents')
      .insert({ titre, description })
      .select()
      .single();
    if (error) throw error;

    const fichiers = [];
    for (const file of req.files) {
      const url = await uploadToStorage(file.buffer, 'documents', file.originalname, file.mimetype);
      const { data: fichier, error: fileError } = await supabase
        .from('fichiers_documents')
        .insert({
          publication_id: publication.id,
          fichier: url,
          type_fichier: getFileType(file.mimetype)
        })
        .select()
        .single();
      if (fileError) throw fileError;
      fichiers.push(fichier);
    }

    res.status(201).json({ ok: true, data: { ...publication, fichiers_documents: fichiers } });
  } catch (e) { next(e); }
}

export async function updateDocument(req, res, next) {
  try {
    const { titre, description } = req.body;
    if (!titre || !description) {
      return res.status(400).json({ ok: false, message: 'Titre et description requis' });
    }
    const { data, error } = await supabase
      .from('publications_documents')
      .update({ titre, description })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteDocument(req, res, next) {
  try {
    const { data: fichiers } = await supabase
      .from('fichiers_documents')
      .select('fichier')
      .eq('publication_id', req.params.id);
    for (const fichier of (fichiers || [])) await deleteFromStorage(fichier.fichier);

    const { error } = await supabase
      .from('publications_documents')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { next(e); }
}

export async function addFile(req, res, next) {
  try {
    const files = [];
    for (const file of (req.files || [])) {
      const url = await uploadToStorage(file.buffer, 'documents', file.originalname, file.mimetype);
      const { data, error } = await supabase
        .from('fichiers_documents')
        .insert({
          publication_id: parseInt(req.params.id),
          fichier: url,
          type_fichier: getFileType(file.mimetype)
        })
        .select()
        .single();
      if (error) throw error;
      files.push(data);
    }
    res.json({ ok: true, fichiers: files });
  } catch (e) { next(e); }
}

export async function updateFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'Fichier requis' });

    const { data: old } = await supabase
      .from('fichiers_documents')
      .select('fichier')
      .eq('id', req.params.fileId)
      .single();
    if (old) await deleteFromStorage(old.fichier);

    const url = await uploadToStorage(req.file.buffer, 'documents', req.file.originalname, req.file.mimetype);
    const { data, error } = await supabase
      .from('fichiers_documents')
      .update({ fichier: url, type_fichier: getFileType(req.file.mimetype) })
      .eq('id', req.params.fileId)
      .select()
      .single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteFile(req, res, next) {
  try {
    const { data: fichier } = await supabase
      .from('fichiers_documents')
      .select('fichier')
      .eq('id', req.params.fileId)
      .single();
    if (fichier) await deleteFromStorage(fichier.fichier);

    const { error } = await supabase
      .from('fichiers_documents')
      .delete()
      .eq('id', req.params.fileId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { next(e); }
}