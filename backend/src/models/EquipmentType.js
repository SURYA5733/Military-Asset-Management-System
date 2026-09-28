import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  { name: { type: String, required: true, unique: true }, unit: { type: String, default: 'units' } },
  { timestamps: true }
);

export const EquipmentType = mongoose.model('EquipmentType', schema);