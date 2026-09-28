import mongoose from 'mongoose';

const baseSchema = new mongoose.Schema(
  { name: { type: String, required: true, unique: true }, location: { type: String, required: true } },
  { timestamps: true }
);

export const Base = mongoose.model('Base', baseSchema);