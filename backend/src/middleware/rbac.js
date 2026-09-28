export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: `Forbidden: requires one of [${roles.join(', ')}]` });
    next();
  };

// For POST bodies: ensure the target baseId matches user's base (admins bypass)
export const requireSameBase = (getBaseId) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  if (req.user.role === 'ADMIN') return next();
  const target = getBaseId(req);
  if (!target || String(target) !== String(req.user.baseId))
    return res.status(403).json({ error: 'Forbidden: base mismatch' });
  next();
};

// For GET endpoints: force baseId filter to user's base (admins bypass)
export const scopeBaseId = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  if (req.user.role !== 'ADMIN') {
    req.query.baseId = String(req.user.baseId ?? '');
  }
  next();
};