import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';

function buildMatch(filters, { beforePeriod = false } = {}) {
  const match = {};
  if (filters.baseId) match.baseId = new mongoose.Types.ObjectId(filters.baseId);
  if (filters.equipmentTypeId) match.equipmentTypeId = new mongoose.Types.ObjectId(filters.equipmentTypeId);

  if (beforePeriod && filters.from) {
    match.createdAt = { $lt: new Date(filters.from) };
  } else if (!beforePeriod && (filters.from || filters.to)) {
    match.createdAt = {};
    if (filters.from) match.createdAt.$gte = new Date(filters.from);
    if (filters.to) match.createdAt.$lte = new Date(filters.to);
  }
  return match;
}

async function sumByTypes(types, match) {
  const rows = await Transaction.aggregate([
    { $match: { ...match, type: { $in: types } } },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);
  return rows[0]?.total ?? 0;
}

export async function getMetrics(filters) {
  const periodMatch = buildMatch(filters);
  const beforeMatch = buildMatch(filters, { beforePeriod: true });

  const POS = ['PURCHASE', 'TRANSFER_IN'];
  const NEG = ['TRANSFER_OUT', 'ASSIGNMENT', 'EXPENDITURE'];

  const openingPos = await sumByTypes(POS, beforeMatch);
  const openingNeg = await sumByTypes(NEG, beforeMatch);
  const openingBalance = openingPos - openingNeg;

  const purchases = await sumByTypes(['PURCHASE'], periodMatch);
  const transfersIn = await sumByTypes(['TRANSFER_IN'], periodMatch);
  const transfersOut = await sumByTypes(['TRANSFER_OUT'], periodMatch);
  const assigned = await sumByTypes(['ASSIGNMENT'], periodMatch);
  const expended = await sumByTypes(['EXPENDITURE'], periodMatch);

  const netMovement = purchases + transfersIn - transfersOut;
  const closingBalance = openingBalance + netMovement - assigned - expended;

  return { openingBalance, closingBalance, netMovement, purchases, transfersIn, transfersOut, assigned, expended };
}

export async function getNetMovementDetail(filters) {
  const match = buildMatch(filters);

  const [purchases, transfersIn, transfersOut] = await Promise.all([
    Transaction.find({ ...match, type: 'PURCHASE' })
      .populate('baseId', 'name')
      .populate('equipmentTypeId', 'name')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    Transaction.find({ ...match, type: 'TRANSFER_IN' })
      .populate('baseId', 'name')
      .populate('equipmentTypeId', 'name')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    Transaction.find({ ...match, type: 'TRANSFER_OUT' })
      .populate('baseId', 'name')
      .populate('equipmentTypeId', 'name')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
  ]);

  // Normalize populated field names for frontend consistency
  const norm = (rows) =>
    rows.map((r) => ({
      ...r,
      id: r._id,
      base: r.baseId,
      equipmentType: r.equipmentTypeId,
    }));

  return {
    purchases: norm(purchases),
    transfersIn: norm(transfersIn),
    transfersOut: norm(transfersOut),
  };
}