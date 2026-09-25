/**
 * Script de migration SQLite → Supabase PostgreSQL
 * Usage : node src/scripts/migrate_sqlite.js
 *
 * Prérequis :
 *   - Supabase PostgreSQL initialisé avec supabase/schema.sql
 *   - Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env
 *   - better-sqlite3 installé : npm install better-sqlite3
 */
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH   = path.resolve(__dirname, '../../../database/fseg.db');

console.log('🚀 Migration SQLite → Supabase PostgreSQL');
console.log(`📂 SQLite: ${DB_PATH}`);

const sqlite    = new Database(DB_PATH, { readonly: true });
const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws }
});

async function migrate() {
  // 1. Classes
  console.log('\n📦 Migration: classes...');
  const classes = sqlite.prepare('SELECT * FROM classes').all();
  for (const c of classes) {
    const { error } = await supabase.from('classes').upsert(
      { id: c.id, niveau: c.niveau, filiere: c.filiere, option_nom: c.option_nom || null, nom_classe: c.nom_classe },
      { onConflict: 'nom_classe' }
    );
    if (error) console.warn(`  ⚠ classe ${c.nom_classe}:`, error.message);
  }
  console.log(`  ✅ ${classes.length} classes migrées`);

  // 2. Étudiants officiels
  console.log('\n📦 Migration: etudiants_officiels...');
  const etudiants = sqlite.prepare('SELECT * FROM etudiants_officiels').all();
  const BATCH = 100;
  for (let i = 0; i < etudiants.length; i += BATCH) {
    const batch = etudiants.slice(i, i + BATCH).map(e => ({
      id: e.id, numero_ordre: e.numero_ordre || null, matricule: e.matricule,
      cenou: e.cenou || null, prenom: e.prenom, nom: e.nom,
      date_naissance: e.date_naissance || null, lieu_naissance: e.lieu_naissance || null,
      passage: e.passage || null, amphi: e.amphi || null, id_classe: e.id_classe || null
    }));
    const { error } = await supabase.from('etudiants_officiels').upsert(batch, { onConflict: 'matricule' });
    if (error) console.warn(`  ⚠ batch ${i}:`, error.message);
    process.stdout.write(`\r  ${Math.min(i + BATCH, etudiants.length)}/${etudiants.length}`);
  }
  console.log(`\n  ✅ ${etudiants.length} étudiants migrés`);

  // 3. Comptes étudiants
  console.log('\n📦 Migration: comptes_etudiants...');
  const comptes = sqlite.prepare('SELECT * FROM comptes_etudiants WHERE supprime = 0').all();
  for (const c of comptes) {
    const { error } = await supabase.from('comptes_etudiants').upsert({
      id: c.id, id_etudiant: c.id_etudiant, id_classe: c.id_classe || null,
      telephone: c.telephone || null, photo_profil: c.photo_profil || null,
      mot_de_passe: c.mot_de_passe, // déjà bcrypt
      actif: c.actif === 1, supprime: false
    }, { onConflict: 'id_etudiant' });
    if (error) console.warn(`  ⚠ compte ${c.id}:`, error.message);
  }
  console.log(`  ✅ ${comptes.length} comptes migrés`);

  // 4. Cours
  console.log('\n📦 Migration: cours + fichiers_cours...');
  const cours = sqlite.prepare('SELECT * FROM cours').all();
  for (const c of cours) {
    const { error } = await supabase.from('cours').upsert(
      { id: c.id, titre: c.titre, description: c.description || null, id_classe: c.id_classe, created_at: c.created_at },
      { onConflict: 'id' }
    );
    if (error) { console.warn(`  ⚠ cours ${c.id}:`, error.message); continue; }
    const fichiers = sqlite.prepare('SELECT * FROM fichiers_cours WHERE cours_id = ?').all(c.id);
    for (const f of fichiers) {
      await supabase.from('fichiers_cours').upsert(
        { id: f.id, cours_id: f.cours_id, fichier: f.fichier, type_fichier: f.type_fichier || 'document' },
        { onConflict: 'id' }
      );
    }
  }
  console.log(`  ✅ ${cours.length} cours migrés`);

  // 5. Notes
  console.log('\n📦 Migration: notes + fichiers_notes...');
  const notes = sqlite.prepare('SELECT * FROM notes').all();
  for (const n of notes) {
    await supabase.from('notes').upsert({ id: n.id, titre: n.titre, description: n.description || null, id_classe: n.id_classe, created_at: n.created_at }, { onConflict: 'id' });
    const fichiers = sqlite.prepare('SELECT * FROM fichiers_notes WHERE note_id = ?').all(n.id);
    for (const f of fichiers) {
      await supabase.from('fichiers_notes').upsert({ id: f.id, note_id: f.note_id, fichier: f.fichier, type_fichier: f.type_fichier || 'document' }, { onConflict: 'id' });
    }
  }
  console.log(`  ✅ ${notes.length} publications notes migrées`);

  // 6. Emplois
  console.log('\n📦 Migration: emplois + fichiers_emplois...');
  const emplois = sqlite.prepare('SELECT * FROM emplois').all();
  for (const e of emplois) {
    await supabase.from('emplois').upsert({ id: e.id, titre: e.titre, description: e.description || null, id_classe: e.id_classe, created_at: e.created_at }, { onConflict: 'id' });
    const fichiers = sqlite.prepare('SELECT * FROM fichiers_emplois WHERE emploi_id = ?').all(e.id);
    for (const f of fichiers) {
      await supabase.from('fichiers_emplois').upsert({ id: f.id, emploi_id: f.emploi_id, fichier: f.fichier, type_fichier: f.type_fichier || 'document', is_pinned: f.is_pinned === 1 }, { onConflict: 'id' });
    }
  }
  console.log(`  ✅ ${emplois.length} emplois migrés`);

  // 7. Actualités + fichiers
  console.log('\n📦 Migration: actualites + fichiers_actualites...');
  const actualites = sqlite.prepare('SELECT * FROM actualites').all();
  for (const a of actualites) {
    const { error } = await supabase.from('actualites').upsert({
      id: a.id,
      titre: a.titre,
      contenu: a.contenu || null,
      categorie: a.categorie || 'Général',
      date_publication: a.date_publication || a.created_at || null,
      created_at: a.created_at || null
    }, { onConflict: 'id' });
    if (error) {
      console.warn(`  ⚠ actualité ${a.id}:`, error.message);
      continue;
    }

    const fichiers = sqlite.prepare('SELECT * FROM actualites_fichiers WHERE actualite_id = ?').all(a.id);
    for (const f of fichiers) {
      await supabase.from('fichiers_actualites').upsert({
        id: f.id,
        actualite_id: f.actualite_id,
        fichier: f.fichier,
        type_fichier: f.type_fichier || 'document'
      }, { onConflict: 'id' });
    }
  }
  console.log(`  ✅ ${actualites.length} actualités migrées`);

  // 8. Publications de documents officiels + fichiers
  console.log('\n📦 Migration: publications_documents + fichiers_documents...');
  const publications = sqlite.prepare('SELECT * FROM publications_documents').all();
  for (const p of publications) {
    const { error } = await supabase.from('publications_documents').upsert({
      id: p.id,
      titre: p.titre,
      description: p.description || '',
      created_at: p.created_at || null
    }, { onConflict: 'id' });
    if (error) {
      console.warn(`  ⚠ publication document ${p.id}:`, error.message);
      continue;
    }

    const fichiers = sqlite.prepare('SELECT * FROM fichiers_documents WHERE publication_id = ?').all(p.id);
    for (const f of fichiers) {
      await supabase.from('fichiers_documents').upsert({
        id: f.id,
        publication_id: f.publication_id,
        fichier: f.fichier,
        type_fichier: f.type_fichier || 'document'
      }, { onConflict: 'id' });
    }
  }
  console.log(`  ✅ ${publications.length} publications de documents migrées`);

  // 9. Matières + Notes étudiants
  console.log('\n📦 Migration: matieres...');
  const matieres = sqlite.prepare('SELECT * FROM matieres').all();
  for (const m of matieres) {
    await supabase.from('matieres').upsert({ id: m.id, id_import: m.id_import || null, id_classe: m.id_classe, id_semestre: m.id_semestre, code_colonne: m.code_colonne || null, nom_matiere: m.nom_matiere }, { onConflict: 'id' });
  }
  console.log(`  ✅ ${matieres.length} matières migrées`);

  console.log('\n📦 Migration: notes_etudiants...');
  const notesEtu = sqlite.prepare('SELECT * FROM notes_etudiants').all();
  for (let i = 0; i < notesEtu.length; i += BATCH) {
    const batch = notesEtu.slice(i, i + BATCH).map(n => ({ id: n.id, id_etudiant: n.id_etudiant, id_matiere: n.id_matiere, note: n.note }));
    await supabase.from('notes_etudiants').upsert(batch, { onConflict: 'id_etudiant,id_matiere' });
    process.stdout.write(`\r  ${Math.min(i + BATCH, notesEtu.length)}/${notesEtu.length}`);
  }
  console.log(`\n  ✅ ${notesEtu.length} notes migrées`);

  console.log('\n🎉 Migration terminée !');
  console.log('⚠️  Vérifiez que les fichiers locaux /uploads/ sont accessibles ou déjà migrés vers Supabase Storage.');
}

migrate().catch(e => { console.error('❌ Erreur fatale:', e); process.exit(1); });
