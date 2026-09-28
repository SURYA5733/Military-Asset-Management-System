import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { authJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { computeBalance } from '../services/balance.service.js';

const router = Router();

const createSchema = z.object({
  fromBaseId: z.string().min(1),
  toBaseId: z.string().min(1),
  equipmentTypeId: z.string().min(1),
  quantity: z.number().int().positive(),
});

router.post(
  '/',
  authJWT,
  requireRole('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'),
  validate(createSchema),
  async (req, res) => {
    const { fromBaseId, toBaseId, equipmentTypeId, quantity } = req.body;
    if (fromBaseId === toBaseId)
      return res.status(400).json({ error: 'Cannot transfer to the same base' });

    if (req.user.role !== 'ADMIN' && String(req.user.baseId) !== String(fromBaseId))
      return res.status(403).json({ error: 'You can only transfer from your own base' });

    // 1. Check balance
    const available = await computeBalance(fromBaseId, equipmentTypeId);
    if (available < quantity)
      return res.status(400).json({ error: `Insufficient balance: ${available} available` });

    // 2. Attempt atomic-ish transfer with compensation
    let outTx = null;
    try {
      outTx = await Transaction.create({
        type: 'TRANSFER_OUT',
        quantity,
        baseId: fromBaseId,
        counterpartyBaseId: toBaseId,
        equipmentTypeId,
        createdById: req.user.id,
      });

      await Transaction.create({
        type: 'TRANSFER_IN',
        quantity,
        baseId: toBaseId,
        counterpartyBaseId: fromBaseId,
        equipmentTypeId,
        createdById: req.user.id,
      });

      const populated = await outTx.populate([
        { path: 'baseId', select: 'name' },
        { path: 'equipmentTypeId', select: 'name' },
      ]);
      res.status(201).json(populated);
    } catch (err) {
      // Compensate: remove the OUT record if IN failed
      if (outTx) await Transaction.findByIdAndDelete(outTx._id);
      res.status(500).json({ error: 'Transfer failed, rolled back' });
    }
  }
);

router.get('/', authJWT, async (req, res) => {
  const where = { type: { $in: ['TRANSFER_IN', 'TRANSFER_OUT'] } };

  if (req.user.role !== 'ADMIN') {
    where.$or = [{ baseId: req.user.baseId }, { counterpartyBaseId: req.user.baseId }];
  } else if (req.query.baseId) {
    const b = new mongoose.Types.ObjectId(req.query.baseId);
    where.$or = [{ baseId: b }, { counterpartyBaseId: b }];
  }
  if (req.query.equipmentTypeId)
    where.equipmentTypeId = new mongoose.Types.ObjectId(req.query.equipmentTypeId);

  const rows = await Transaction.find(where)
    .populate('baseId', 'name')
    .populate('counterpartyBaseId', 'name')
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
      counterpartyBase: r.counterpartyBaseId,
      equipmentType: r.equipmentTypeId,
      createdBy: r.createdById,
    }))
  );
});

export default router;