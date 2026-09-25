import { supabase } from '../config/supabase.js';

// Retourne les semestres autorisés selon le niveau (L1=S1-S2, L2=S1-S4, L3=S1-S6)
function getSemestresAutorises(niveau) {
  const match = niveau?.match(/L(\d)/);
  if (!match) return [1, 2];
  const max = parseInt(match[1]) * 2;
  return Array.from({ length: max }, (_, i) => i + 1);
}

// Notes individuelles (relevé de notes)
export async function getNotes(req, res, next) {
  try {
    const id_etudiant = req.etudiant.id_etudiant;
    const semestre    = parseInt(req.query.semestre) || 0;

    // Récupérer le niveau de l'étudiant
    const { data: eo } = await supabase
      .from('etudiants_officiels')
      .select('id_classe, classes(niveau)')
      .eq('id', id_etudiant)
      .single();

    if (!eo) return res.status(404).json({ ok: false, message: 'Étudiant introuvable' });

    const semestres_autorises = getSemestresAutorises(eo.classes?.niveau);

    if (!semestre || !semestres_autorises.includes(semestre)) {
      return res.json({ ok: true, semestres: semestres_autorises, notes: [], semestre_selectionne: 0 });
    }

    // Trouver l'id du semestre
    const { data: sem } = await supabase
      .from('semestres')
      .select('id')
      .eq('numero', semestre)
      .single();

    if (!sem) {
      return res.json({ ok: true, semestres: semestres_autorises, notes: [], semestre_selectionne: semestre });
    }

    // Récupérer les notes
    const { data: notes } = await supabase
      .from('matieres')
      .select(`nom_matiere, code_colonne, notes_etudiants!left(note)`)
      .eq('id_classe',   eo.id_classe)
      .eq('id_semestre', sem.id)
      .eq('notes_etudiants.id_etudiant', id_etudiant)
      .order('code_colonne');

    const result = (notes || []).map(m => ({
      matiere: m.nom_matiere,
      note:    m.notes_etudiants?.[0]?.note ?? null
    }));

    res.json({ ok: true, semestres: semestres_autorises, notes: result, semestre_selectionne: semestre });
  } catch (e) { next(e); }
}

// Documents de notes (PDFs publiés par l'admin)
export async function getNoteDocuments(req, res, next) {
  try {
    const id_classe = req.etudiant.id_classe;

    const { data, error } = await supabase
      .from('notes')
      .select('id, titre, description, created_at, fichiers_notes(id, fichier, type_fichier)')
      .eq('id_classe', id_classe)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = (data || []).map(n => ({
      ...n,
      fichiers: (n.fichiers_notes || []).map(f => ({
        id:   f.id,
        nom:  f.fichier.replace(/^\d+_/, '').split('/').pop(),
        url:  f.fichier,
        type: f.type_fichier
      }))
    }));

    res.json({ ok: true, data: result });
  } catch (e) { next(e); }
}
