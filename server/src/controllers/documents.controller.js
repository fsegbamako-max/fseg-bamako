import { supabase } from '../config/supabase.js';

export async function getDocuments(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, titre, fichier, type_fichier, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}
