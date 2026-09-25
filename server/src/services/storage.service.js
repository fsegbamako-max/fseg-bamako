import { supabase, BUCKET } from '../config/supabase.js';
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
 * @returns {string} URL publique du fichier
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

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Supprime un fichier depuis son URL publique Supabase
 */
export async function deleteFromStorage(publicUrl) {
  if (!publicUrl || !publicUrl.includes('supabase')) return;
  try {
    const url     = new URL(publicUrl);
    const parts   = url.pathname.split(`/object/public/${BUCKET}/`);
    if (parts.length < 2) return;
    const filePath = decodeURIComponent(parts[1]);
    await supabase.storage.from(BUCKET).remove([filePath]);
  } catch (e) {
    console.warn('[Storage] Delete warning:', e.message);
  }
}
