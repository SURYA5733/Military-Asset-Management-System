import { Router } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { authJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.get('/', authJWT, requireRole('ADMIN'), async (_req, res) => {
  const logs = await AuditLog.find()
    .populate('userId', 'username role')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  res.json(
    logs.map((l) => ({
      ...l,
      id: l._id,
      user: l.userId,
    }))
  );
});

export default router;