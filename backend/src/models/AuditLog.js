import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  method: String,
  path: String,
  statusCode: Number,
  ip: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, index: true },
});

export const AuditLog = mongoose.model('AuditLog', schema);