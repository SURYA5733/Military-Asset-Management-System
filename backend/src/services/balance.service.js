import { Transaction } from '../models/Transaction.js';

const POSITIVE = ['PURCHASE', 'TRANSFER_IN'];
const NEGATIVE = ['TRANSFER_OUT', 'ASSIGNMENT', 'EXPENDITURE'];

/**
 * Compute balance for a base+equipment (optionally as of a date).
 * Uses MongoDB aggregation — the ledger is immutable so this is always correct.
 */
export async function computeBalance(baseId, equipmentTypeId, before) {
  const match = {
    baseId: new (await import('mongoose')).Types.ObjectId(baseId),
    equipmentTypeId: new (await import('mongoose')).Types.ObjectId(equipmentTypeId),
  };
  if (before) match.createdAt = { $lt: before };

  const rows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$quantity' },
      },
    },
  ]);

  let balance = 0;
  for (const r of rows) {
    if (POSITIVE.includes(r._id)) balance += r.total;
    else if (NEGATIVE.includes(r._id)) balance -= r.total;
  }
  return balance;
}