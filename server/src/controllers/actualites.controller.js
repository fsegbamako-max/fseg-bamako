import { supabase } from '../config/supabase.js';

export async function getActualites(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('actualites')
      .select('id, titre, contenu, categorie, date_publication, fichiers_actualites(id, fichier, type_fichier)', { count: 'exact' })
      .order('date_publication', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    res.json({ ok: true, data, total: count, page, limit });
  } catch (e) { next(e); }
}

export async function getActualite(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('actualites')
      .select('*, fichiers_actualites(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ ok: false, message: 'Actualité introuvable' });
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}
