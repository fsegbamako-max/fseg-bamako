import { supabase } from '../../config/supabase.js';

export async function listClasses(req, res, next) {
  try {
    const { data, error } = await supabase.from('classes').select('*').order('niveau').order('nom_classe');
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function createClasse(req, res, next) {
  try {
    const { niveau, filiere, option_nom, nom_classe } = req.body;
    if (!niveau || !filiere || !nom_classe) return res.status(400).json({ ok: false, message: 'Champs requis manquants' });
    const { data, error } = await supabase.from('classes').insert({ niveau, filiere, option_nom, nom_classe }).select().single();
    if (error) throw error;
    res.status(201).json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function updateClasse(req, res, next) {
  try {
    const { niveau, filiere, option_nom, nom_classe } = req.body;
    const { data, error } = await supabase.from('classes').update({ niveau, filiere, option_nom, nom_classe }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

export async function deleteClasse(req, res, next) {
  try {
    await supabase.from('classes').delete().eq('id', req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}
