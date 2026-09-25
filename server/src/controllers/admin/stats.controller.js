import { supabase } from '../../config/supabase.js';

export async function getDashboardStats(req, res, next) {
  try {
    const [
      { count: totalEtudiants },
      { count: comptesActifs },
      { count: totalClasses },
      { count: totalCours },
      { count: totalNotes }
    ] = await Promise.all([
      supabase.from('etudiants_officiels').select('*', { count: 'exact', head: true }),
      supabase.from('comptes_etudiants').select('*', { count: 'exact', head: true }).eq('actif', true).eq('supprime', false),
      supabase.from('classes').select('*', { count: 'exact', head: true }),
      supabase.from('cours').select('*', { count: 'exact', head: true }),
      supabase.from('notes').select('*', { count: 'exact', head: true })
    ]);

    res.json({
      ok: true,
      stats: {
        total_etudiants:   totalEtudiants || 0,
        comptes_actifs:    comptesActifs  || 0,
        total_classes:     totalClasses   || 0,
        total_cours:       totalCours     || 0,
        total_notes:       totalNotes     || 0
      }
    });
  } catch (e) { next(e); }
}
