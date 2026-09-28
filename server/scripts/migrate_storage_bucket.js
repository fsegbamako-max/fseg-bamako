import { supabase } from '../src/config/supabase.js';
import { getStorageLocation } from '../src/services/storage.service.js';

const sourceBucket = 'fseg-test';
const targetBucket = 'fseg';
const apply = process.argv.includes('--apply');
const references = [
  ['fichiers_documents', 'fichier'],
  ['fichiers_actualites', 'fichier'],
  ['fichiers_notes', 'fichier'],
  ['fichiers_cours', 'fichier'],
  ['fichiers_emplois', 'fichier'],
  ['imports_etudiants', 'fichier'],
  ['imports_notes', 'fichier'],
  ['documents', 'fichier'],
  ['comptes_etudiants', 'photo_profil']
];

async function objectExists(bucket, filePath) {
  const { error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60);
  if (!error) return true;
  if (String(error.statusCode) === '404') return false;
  throw new Error(`Impossible de vérifier un objet dans ${bucket} (${error.statusCode || 'erreur Storage'})`);
}

async function readAllRows(table, field) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from(table)
      .select(`id, ${field}`)
      .range(offset, offset + 499);
    if (error) throw new Error(`Lecture impossible pour ${table}`);
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}

const objectsToCopy = new Map();
const referencesToNormalize = [];
let missingObjects = 0;

for (const [table, field] of references) {
  const rows = await readAllRows(table, field);
  for (const row of rows) {
    const reference = row[field];
    if (!reference) continue;

    const location = getStorageLocation(reference);
    if (!location) {
      missingObjects++;
      continue;
    }

    const isLegacyUrl = /^https?:\/\//i.test(reference);
    if (isLegacyUrl && location.bucket === sourceBucket) {
      referencesToNormalize.push({ table, field, id: row.id, filePath: location.path });
    } else if (!isLegacyUrl && await objectExists(targetBucket, location.path)) {
      continue;
    } else if (!isLegacyUrl && !await objectExists(sourceBucket, location.path)) {
      missingObjects++;
      continue;
    }

    if (location.bucket === sourceBucket || !isLegacyUrl) {
      if (!await objectExists(targetBucket, location.path)) {
        objectsToCopy.set(location.path, location.path);
      }
    }
  }
}

console.log(`Objets à copier vers ${targetBucket}: ${objectsToCopy.size}`);
console.log(`Références d’anciennes URLs à normaliser: ${referencesToNormalize.length}`);
console.log(`Références sans objet trouvé: ${missingObjects}`);

if (!apply) {
  console.log('Simulation uniquement. Ajouter --apply pour copier et mettre à jour les références.');
  process.exit(0);
}

for (const filePath of objectsToCopy.keys()) {
  const { data: file, error: downloadError } = await supabase.storage.from(sourceBucket).download(filePath);
  if (downloadError || !file) throw new Error(`Téléchargement impossible depuis ${sourceBucket}`);

  const { error: uploadError } = await supabase.storage.from(targetBucket).upload(
    filePath,
    Buffer.from(await file.arrayBuffer()),
    { contentType: file.type || 'application/octet-stream', upsert: false }
  );
  if (uploadError && !await objectExists(targetBucket, filePath)) {
    throw new Error(`Copie impossible vers ${targetBucket} (${uploadError.statusCode || 'erreur Storage'})`);
  }
}

for (const reference of referencesToNormalize) {
  if (!await objectExists(targetBucket, reference.filePath)) {
    throw new Error(`Objet non vérifié dans ${targetBucket}; références non normalisées`);
  }
  const { error } = await supabase
    .from(reference.table)
    .update({ [reference.field]: reference.filePath })
    .eq('id', reference.id);
  if (error) throw new Error(`Mise à jour impossible dans ${reference.table}`);
}

console.log('Copie terminée. Le bucket source n’a pas été supprimé.');