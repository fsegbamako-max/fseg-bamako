import { supabase } from '../config/supabase.js';

export async function getEmplois(req, res, next) {
  try {
    const id_classe = req.etudiant.id_classe;

    // Fichier épinglé
    const { data: pinnedData } = await supabase
      .from('fichiers_emplois')
      .select('id, fichier, type_fichier, emplois!inner(id_classe, created_at)')
      .eq('emplois.id_classe', id_classe)
      .eq('is_pinned', true)
      .order('created_at', { foreignTable: 'emplois', ascending: false })
      .limit(1)
      .single();

    // Autres fichiers
    const { data: autresData } = await supabase
      .from('fichiers_emplois')
      .select('id, fichier, type_fichier, emplois!inner(id_classe, created_at)')
      .eq('emplois.id_classe', id_classe)
      .eq('is_pinned', false)
      .order('created_at', { foreignTable: 'emplois', ascending: false });

    const cleanName = url => url?.replace(/^\d+_/, '').split('/').pop().split('?')[0] || '';

    const pinned = pinnedData ? {
      id:  pinnedData.id,
      nom: cleanName(pinnedData.fichier),
      url: pinnedData.fichier,
      type: pinnedData.type_fichier
    } : null;

    const autres = (autresData || []).map(f => ({
      id:   f.id,
      nom:  cleanName(f.fichier),
      url:  f.fichier,
      date: f.emplois?.created_at,
      type: f.type_fichier
    }));

    res.json({ ok: true, pinned, autres });
  } catch (e) { next(e); }
}
