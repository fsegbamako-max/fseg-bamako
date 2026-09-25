import { supabase } from '../config/supabase.js';

function cleanFilename(url) {
  if (!url) return '';
  return url.replace(/^\d+_/, '').split('/').pop().split('?')[0];
}

export async function getCours(req, res, next) {
  try {
    const id_classe = req.etudiant.id_classe;

    const { data, error } = await supabase
      .from('cours')
      .select(`id, titre, description, created_at, fichiers_cours(id, fichier, type_fichier)`)
      .eq('id_classe', id_classe)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = (data || []).map(c => ({
      ...c,
      fichiers: (c.fichiers_cours || []).map(f => ({
        id:   f.id,
        nom:  cleanFilename(f.fichier),
        url:  f.fichier,
        type: f.type_fichier
      }))
    }));

    res.json({ ok: true, data: result });
  } catch (e) { next(e); }
}
