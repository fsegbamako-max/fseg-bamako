import { createStorageProxyToken } from '../services/storage.service.js';

const storageReferenceFields = new Set(['fichier', 'photo_profil', 'url']);

function getApiBaseUrl(req) {
  const configuredUrl = process.env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL;
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');

  const protocol = req.get('x-forwarded-proto')?.split(',')[0] || req.protocol;
  return `${protocol}://${req.get('host')}`;
}

async function signReferences(value, cache, apiBaseUrl) {
  if (Array.isArray(value)) {
    return Promise.all(value.map(item => signReferences(item, cache, apiBaseUrl)));
  }
  if (!value || typeof value !== 'object') return value;

  const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => {
    if (storageReferenceFields.has(key) && typeof item === 'string' && item) {
      if (!cache.has(item)) {
        cache.set(item, createStorageProxyToken(item).then(token =>
          token ? `${apiBaseUrl}/api/storage/${encodeURIComponent(token)}` : null
        ));
      }
      return [key, await cache.get(item)];
    }
    return [key, await signReferences(item, cache, apiBaseUrl)];
  }));
  return Object.fromEntries(entries);
}

export function signStorageUrls(req, res, next) {
  const sendJson = res.json.bind(res);
  res.json = body => {
    signReferences(body, new Map(), getApiBaseUrl(req))
      .then(signedBody => sendJson(signedBody))
      .catch(next);
    return res;
  };
  next();
}