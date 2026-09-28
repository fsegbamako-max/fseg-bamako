import { BUCKET, supabase } from '../src/config/supabase.js';
import { createStorageSignedUrl, getStorageLocation } from '../src/services/storage.service.js';

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

console.log(`Bucket configuré: ${BUCKET}`);

for (const [table, field] of references) {
  let tested = 0;
  let inFseg = 0;
  let inTest = 0;
  let inBoth = 0;
  let inNeither = 0;
  let storedAsUrl = 0;
  let storedAsPath = 0;
  let offset = 0;
  let readError = false;

  while (true) {
    const { data, error } = await supabase.from(table).select(field).range(offset, offset + 499);
    if (error) {
      console.log(`${table}.${field}: lecture impossible`);
      readError = true;
      break;
    }

    for (const row of data || []) {
      if (!row[field]) continue;
      if (/^https?:\/\//i.test(row[field])) storedAsUrl++;
      else storedAsPath++;
      const location = getStorageLocation(row[field]);
      if (!location) continue;

      const results = await Promise.all(['fseg', 'fseg-test'].map(bucket =>
        supabase.storage.from(bucket).createSignedUrl(location.path, 30)
      ));
      const foundFseg = !results[0].error;
      const foundTest = !results[1].error;
      tested++;
      if (foundFseg) inFseg++;
      if (foundTest) inTest++;
      if (foundFseg && foundTest) inBoth++;
      if (!foundFseg && !foundTest) inNeither++;
    }

    if (!data || data.length < 500) break;
    offset += 500;
  }

  if (!readError) {
    console.log(`${table}.${field}: testés=${tested}, URLs=${storedAsUrl}, chemins=${storedAsPath}, fseg=${inFseg}, fseg-test=${inTest}, présents dans les deux=${inBoth}, introuvables=${inNeither}`);
  }
}