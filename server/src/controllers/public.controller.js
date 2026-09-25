import { supabase } from '../config/supabase.js';

export async function getActualites(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const { data: actualites, error } = await supabase
      .from('actualites')
      .select('id, titre, contenu, categorie, date_publication, fichiers_actualites(id, fichier, type_fichier)')
      .order('date_publication', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ ok: true, data: actualites || [] });
  } catch (e) { next(e); }
}

export async function getDocuments(req, res, next) {
  try {
    const { data: publications, error } = await supabase
      .from('publications_documents')
      .select('id, titre, description, created_at, fichiers_documents(id, fichier, type_fichier)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ ok: true, data: publications || [] });
  } catch (e) { next(e); }
}
