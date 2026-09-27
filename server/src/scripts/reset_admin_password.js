import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'node:crypto';
import { supabase } from '../config/supabase.js';

const username = process.argv[2]?.trim().toLowerCase();

if (!username || !/^[a-z0-9._-]{3,40}$/.test(username)) {
  console.error('Usage: node src/scripts/reset_admin_password.js <username>');
  process.exit(1);
}

function readHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error('Lancez ce script dans un terminal interactif.');
  }

  return new Promise((resolve, reject) => {
    const input = process.stdin;
    process.stdout.write(prompt);
    input.setRawMode(true);
    input.setEncoding('utf8');
    input.resume();
    let value = '';

    function finish(error) {
      input.off('data', onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    }

    function onData(key) {
      if (key === '\u0003') return finish(new Error('Réinitialisation annulée.'));
      if (key === '\r' || key === '\n') return finish();
      if (key === '\u007f' || key === '\b') {
        value = value.slice(0, -1);
        return;
      }
      if (key >= ' ') value += key;
    }

    input.on('data', onData);
  });
}

try {
  const { data: admin, error: lookupError } = await supabase
    .from('admins')
    .select('id, username')
    .eq('username', username)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!admin) throw new Error(`Compte introuvable : ${username}`);

  const password = await readHidden(`Nouveau mot de passe pour ${admin.username} (8 à 72 octets) : `);
  const confirmation = await readHidden('Confirmez le nouveau mot de passe : ');
  const passwordBytes = Buffer.from(password, 'utf8');
  const confirmationBytes = Buffer.from(confirmation, 'utf8');

  if (passwordBytes.length < 8 || passwordBytes.length > 72) {
    throw new Error('Le mot de passe doit contenir entre 8 et 72 octets.');
  }
  if (passwordBytes.length !== confirmationBytes.length || !timingSafeEqual(passwordBytes, confirmationBytes)) {
    throw new Error('Les mots de passe ne correspondent pas.');
  }

  const { error: updateError } = await supabase
    .from('admins')
    .update({ mot_de_passe: await bcrypt.hash(password, 12) })
    .eq('id', admin.id);
  if (updateError) throw updateError;

  console.log(`Mot de passe mis à jour pour ${admin.username}.`);
} catch (error) {
  console.error(error.message || 'Réinitialisation impossible.');
  process.exitCode = 1;
}