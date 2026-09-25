/**
 * Script de création d'un compte administrateur
 * Usage : node src/scripts/create_admin.js <username> <mot_de_passe> [nom_complet]
 */
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

const [,, username, password, nom_complet] = process.argv;

if (!username || !password) {
  console.error('Usage: node src/scripts/create_admin.js <username> <mot_de_passe> [nom_complet]');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);

const { data, error } = await supabase
  .from('admins')
  .insert({ username: username.toLowerCase(), mot_de_passe: hash, nom_complet: nom_complet || username })
  .select()
  .single();

if (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
console.log(`✅ Admin créé: ${data.username} (id: ${data.id})`);
