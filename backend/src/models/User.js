import mongoose from 'mongoose';

export const ROLES = ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'];

const schema = new mongoose.Schema(
  {
    username:     { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ROLES, required: true },
    baseId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Base', default: null },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

schema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    username: this.username,
    role: this.role,
    baseId: this.baseId,
    isActive: this.isActive,
  };
};

export const User = mongoose.model('User', schema);