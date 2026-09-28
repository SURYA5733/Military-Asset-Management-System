import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { authJWT } from '../middleware/auth.js';
import { requireRole, requireSameBase, scopeBaseId } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createSchema = z.object({
  baseId: z.string().min(1),
  equipmentTypeId: z.string().min(1),
  quantity: z.number().int().positive(),
});

router.post(
  '/',
  authJWT,
  requireRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'),
  validate(createSchema),
  requireSameBase((req) => req.body.baseId),
  async (req, res) => {
    const tx = await Transaction.create({
      type: 'PURCHASE',
      ...req.body,
      createdById: req.user.id,
    });
    const populated = await tx.populate([
      { path: 'baseId', select: 'name' },
      { path: 'equipmentTypeId', select: 'name' },
    ]);
    res.status(201).json(populated);
  }
);

router.get('/', authJWT, scopeBaseId, async (req, res) => {
  const where = { type: 'PURCHASE' };
  if (req.query.baseId) where.baseId = new mongoose.Types.ObjectId(req.query.baseId);
  if (req.query.equipmentTypeId) where.equipmentTypeId = new mongoose.Types.ObjectId(req.query.equipmentTypeId);
  if (req.query.from || req.query.to) {
    where.createdAt = {};
    if (req.query.from) where.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) where.createdAt.$lte = new Date(req.query.to);
  }

  const rows = await Transaction.find(where)
    .populate('baseId', 'name')
    .populate('equipmentTypeId', 'name')
    .populate('createdById', 'username')
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  res.json(
    rows.map((r) => ({
      ...r,
      id: r._id,
      base: r.baseId,
      equipmentType: r.equipmentTypeId,
      createdBy: r.createdById,
    }))
  );
});

export default router;