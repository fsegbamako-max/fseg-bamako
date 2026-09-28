import { Readable } from 'node:stream';
import jwt from 'jsonwebtoken';
import { supabase, BUCKET, FALLBACK_BUCKETS } from '../config/supabase.js';

export async function streamStorageFile(req, res) {
  let payload;
  try {
    payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
  } catch {
    return res.status(404).json({ ok: false, message: 'Fichier indisponible ou lien expiré' });
  }

  const allowedBuckets = new Set([BUCKET, ...FALLBACK_BUCKETS]);
  if (
    payload.purpose !== 'storage-file'
    || !allowedBuckets.has(payload.bucket)
    || typeof payload.path !== 'string'
    || payload.path.split('/').some(part => !part || part === '.' || part === '..')
  ) {
    return res.status(404).json({ ok: false, message: 'Fichier indisponible ou lien expiré' });
  }

  try {
    const { data, error } = await supabase.storage
      .from(payload.bucket)
      .createSignedUrl(payload.path, 60);
    if (error || !data?.signedUrl) {
      return res.status(404).json({ ok: false, message: 'Fichier introuvable' });
    }

    const headers = req.headers.range ? { Range: req.headers.range } : {};
    const upstream = await fetch(data.signedUrl, { headers });
    if (!upstream.ok || !upstream.body) {
      return res.status(upstream.status === 404 ? 404 : 502).json({ ok: false, message: 'Lecture du fichier impossible' });
    }

    res.status(upstream.status);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    for (const header of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }

    Readable.fromWeb(upstream.body).on('error', () => res.destroy()).pipe(res);
  } catch {
    if (!res.headersSent) res.status(502).json({ ok: false, message: 'Lecture du fichier impossible' });
    else res.destroy();
  }
}