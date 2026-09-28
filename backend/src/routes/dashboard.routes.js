import { Router } from 'express';
import { authJWT } from '../middleware/auth.js';
import { scopeBaseId } from '../middleware/rbac.js';
import { getMetrics, getNetMovementDetail } from '../services/dashboard.service.js';

const router = Router();

function parseFilters(req) {
  return {
    baseId: req.query.baseId || undefined,
    equipmentTypeId: req.query.equipmentTypeId || undefined,
    from: req.query.from || undefined,
    to: req.query.to || undefined,
  };
}

router.get('/metrics', authJWT, scopeBaseId, async (req, res) => {
  res.json(await getMetrics(parseFilters(req)));
});

router.get('/net-movement-detail', authJWT, scopeBaseId, async (req, res) => {
  res.json(await getNetMovementDetail(parseFilters(req)));
});

export default router;