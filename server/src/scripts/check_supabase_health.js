/**
 * Smoke test des accès Supabase utilisés par l'API.
 *
 * Usage :
 *   npm run supabase:health
 *
 * Le script ne lit aucune donnée sensible et ne journalise ni l'URL Supabase
 * ni la clé de service. Il retourne un code non nul dès qu'un contrôle échoue.
 */
import dotenv from 'dotenv';
import { supabase, BUCKET } from '../config/supabase.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

class HealthCheckError extends Error {}

function assertSupabaseResult(service, result) {
  if (result?.error) {
    throw new HealthCheckError(`${service}: ${result.error.message || 'réponse en erreur'}`);
  }
}

function safeErrorMessage(error) {
  let message = error instanceof Error ? error.message : String(error);

  // Les erreurs de bibliothèques HTTP peuvent inclure l'URL appelée. La clé
  // de service est également retirée explicitement par précaution.
  if (supabaseUrl) {
    message = message.split(supabaseUrl).join('[URL Supabase masquée]');
  }
  if (serviceRoleKey) {
    message = message.split(serviceRoleKey).join('[clé Supabase masquée]');
  }

  return message
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[URL masquée]')
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [clé masquée]')
    .slice(0, 240);
}

async function checkSupabaseApi() {
  const response = await fetch(new URL('/rest/v1/', supabaseUrl), {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new HealthCheckError(`HTTP ${response.status}`);
  }
}

async function checkAdminRead() {
  const result = await supabase
    .from('admins')
    .select('id')
    .limit(1);

  assertSupabaseResult('lecture admins', result);
}

async function checkStudentRead() {
  const officialStudents = await supabase
    .from('etudiants_officiels')
    .select('id')
    .limit(1);
  assertSupabaseResult('lecture etudiants_officiels', officialStudents);

  const studentAccounts = await supabase
    .from('comptes_etudiants')
    .select('id')
    .limit(1);
  assertSupabaseResult('lecture comptes_etudiants', studentAccounts);
}

async function checkStorage() {
  const result = await supabase.storage
    .from(BUCKET)
    .list('', { limit: 1, offset: 0 });

  assertSupabaseResult('Storage', result);
}

const checks = [
  ['API Supabase', checkSupabaseApi],
  ['Lecture admin', checkAdminRead],
  ['Lecture étudiant', checkStudentRead],
  ['Storage', checkStorage],
];

let hasFailure = false;

for (const [label, check] of checks) {
  try {
    await check();
    console.log(`✅ ${label}`);
  } catch (error) {
    hasFailure = true;
    console.error(`❌ ${label}: ${safeErrorMessage(error)}`);
  }
}

if (hasFailure) {
  console.error('Contrôle Supabase en échec.');
  process.exitCode = 1;
} else {
  console.log('Contrôle Supabase réussi.');
}