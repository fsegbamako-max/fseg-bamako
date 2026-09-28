import { supabase, SUPABASE_URL, BUCKET, FALLBACK_BUCKETS } from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import path from 'path';

/**
 * Détermine le type de fichier depuis le MIME
 */
export function getFileType(mimetype) {
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.startsWith('image/'))  return 'image';
  if (mimetype.startsWith('video/'))  return 'video';
  if (mimetype.includes('word'))      return 'document';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'excel';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'ppt';
  return 'document';
}

/**
 * Upload un fichier Buffer vers Supabase Storage
 * @returns {string} chemin du fichier dans le bucket configuré
 */
export async function uploadToStorage(buffer, folder, originalname, mimetype) {
  const ext      = path.extname(originalname).toLowerCase() || '.bin';
  const safeName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_');
  const filename = `${Date.now()}_${safeName}`;
  const filePath = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: mimetype,
      upsert: false
    });

  if (error) {
    console.error('[Storage] Upload error:', error);
    throw new Error(`Erreur Supabase Storage: ${error.message}`);
  }

  return filePath;
}

/**
 * Resolve a legacy Storage URL or stored object path to a bucket path.
 */
export function getStoragePath(reference) {
  return getStorageLocation(reference)?.path ?? null;
}

export function getStorageLocation(reference) {
  if (typeof reference !== 'string' || !reference.trim()) return null;

  const value = reference.trim();
  if (!/^https?:\/\//i.test(value)) {
    const filePath = value.replace(/^\/+/, '');
    return filePath ? { bucket: BUCKET, path: filePath } : null;
  }

  try {
    const url = new URL(value);
    if (url.origin !== new URL(SUPABASE_URL).origin) return null;
    const match = url.pathname.match(/\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
    if (!match) return null;
    return { bucket: decodeURIComponent(match[1]), path: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}
export async function resolveStorageLocation(reference) {
  const location = getStorageLocation(reference);
  if (!location) return null;

  const buckets = [location.bucket, ...FALLBACK_BUCKETS.filter(bucket => bucket !== location.bucket)];
  let lastError;
  for (const bucket of buckets) {
    const { error } = await supabase.storage.from(bucket).createSignedUrl(location.path, 60);
    if (!error) return { bucket, path: location.path };
    lastError = error;
    if (String(error.statusCode) !== '404') break;
  }

  console.warn('[Storage] Signed URL failed:', lastError?.statusCode || 'unknown status', lastError?.error || 'storage error');
  throw new Error('Impossible de créer le lien temporaire du fichier');
}

export async function createStorageSignedUrl(reference, expiresIn = 3600) {
  const location = await resolveStorageLocation(reference);
  if (!location) return null;
  const { data, error } = await supabase.storage
    .from(location.bucket)
    .createSignedUrl(location.path, expiresIn);
  if (error) throw new Error('Impossible de créer le lien temporaire du fichier');
  return data.signedUrl;
}

export async function createStorageProxyToken(reference) {
  const location = await resolveStorageLocation(reference);
  if (!location) return null;
  return jwt.sign({ purpose: 'storage-file', ...location }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Supprime un fichier depuis son URL historique ou son chemin Storage.
 */
export async function deleteFromStorage(reference) {
  const location = getStorageLocation(reference);
  if (!location) return;
  try {
    const { error } = await supabase.storage.from(location.bucket).remove([location.path]);
    if (error) throw error;
  } catch (e) {
    console.warn('[Storage] Delete warning:', e.message);
  }
}
