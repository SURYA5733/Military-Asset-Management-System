import { AuditLog } from '../models/AuditLog.js';

const REDACT = new Set(['password', 'passwordHash', 'token']);

function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = REDACT.has(k) ? '[REDACTED]' : redact(v);
  return out;
}

export const auditLog = (req, res, next) => {
  res.on('finish', async () => {
    const interesting = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    if (!interesting) return;
    try {
      await AuditLog.create({
        userId: req.user?.id ?? null,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip,
        metadata: { body: redact(req.body), query: req.query },
      });
    } catch (e) {
      console.error('audit log failed', e.message);
    }
  });
  next();
};