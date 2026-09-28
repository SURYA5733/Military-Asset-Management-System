import mongoose from 'mongoose';

export const TX_TYPES = [
  'PURCHASE',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'ASSIGNMENT',
  'EXPENDITURE',
];

const schema = new mongoose.Schema(
  {
    type: { type: String, enum: TX_TYPES, required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    baseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Base', required: true, index: true },
    equipmentTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipmentType', required: true },
    counterpartyBaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Base', default: null },
    personnelName: { type: String, default: null },
    reason: { type: String, default: null },
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Compound index for fast dashboard queries
schema.index({ baseId: 1, equipmentTypeId: 1, createdAt: -1 });
schema.index({ type: 1, createdAt: -1 });

export const Transaction = mongoose.model('Transaction', schema);