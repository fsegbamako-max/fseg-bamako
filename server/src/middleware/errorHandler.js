export function errorHandler(err, req, res, next) {
  const safeLogValue = value => String(value ?? '').replace(/[\r\n]/g, ' ');
  console.error('[ERROR] %s %s: %s', safeLogValue(req.method), safeLogValue(req.path), safeLogValue(err?.message));

  if (err.name === 'MulterError') {
    return res.status(400).json({ ok: false, message: `Upload: ${err.message}` });
  }

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? (status < 500 ? err.message : 'Erreur interne du serveur')
    : err.message;

  res.status(status).json({ ok: false, message });
}

export function notFound(req, res) {
  res.status(404).json({ ok: false, message: `Route introuvable: ${req.method} ${req.path}` });
}
