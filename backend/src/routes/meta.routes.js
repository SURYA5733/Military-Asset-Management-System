import { Router } from 'express';
import { Base } from '../models/Base.js';
import { EquipmentType } from '../models/EquipmentType.js';
import { authJWT } from '../middleware/auth.js';

const router = Router();

router.get('/bases', authJWT, async (req, res) => {
  if (req.user.role === 'ADMIN') {
    return res.json(await Base.find().sort({ name: 1 }).lean());
  }
  const base = await Base.findById(req.user.baseId).lean();
  res.json(base ? [base] : []);
});

router.get('/equipment-types', authJWT, async (_req, res) => {
  res.json(await EquipmentType.find().sort({ name: 1 }).lean());
});

export default router;