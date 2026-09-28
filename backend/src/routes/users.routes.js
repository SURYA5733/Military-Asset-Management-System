import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User, ROLES } from '../models/User.js';
import { Base } from '../models/Base.js';
import { authJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Every route below is admin-only
router.use(authJWT, requireRole('ADMIN'));

/* ---------- Schemas ---------- */

const createSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Only letters, numbers, dot, dash, underscore'),
    password: z.string().min(8).max(128),
    role: z.enum(ROLES),
    baseId: z.string().nullable().optional(),
  })
  .refine(
    (d) => d.role === 'ADMIN' ? !d.baseId : !!d.baseId,
    { message: 'Non-admin users must be assigned to a base; admins must not have a base' }
  );

const updateSchema = z.object({
  role: z.enum(ROLES).optional(),
  baseId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const passwordSchema = z.object({
  password: z.string().min(8).max(128),
});

/* ---------- Helpers ---------- */

function shape(user) {
  return {
    id: user._id,
    username: user.username,
    role: user.role,
    baseId: user.baseId?._id ?? user.baseId ?? null,
    baseName: user.baseId?.name ?? null,
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
  };
}

/* ---------- Routes ---------- */

// GET /api/users — list all users
router.get('/', async (_req, res) => {
  const users = await User.find()
    .populate('baseId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  res.json(users.map(shape));
});

// POST /api/users — create
router.post('/', validate(createSchema), async (req, res) => {
  const { username, password, role, baseId } = req.body;

  const existing = await User.findOne({ username });
  if (existing) return res.status(409).json({ error: 'Username already exists' });

  if (baseId && !mongoose.isValidObjectId(baseId))
    return res.status(400).json({ error: 'Invalid baseId' });

  if (baseId) {
    const base = await Base.findById(baseId);
    if (!base) return res.status(400).json({ error: 'Base not found' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    passwordHash,
    role,
    baseId: role === 'ADMIN' ? null : baseId,
  });

  const populated = await user.populate('baseId', 'name');
  res.status(201).json(shape(populated));
});

// PATCH /api/users/:id — update role / baseId / isActive
router.patch('/:id', validate(updateSchema), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'Invalid user id' });

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { role, baseId, isActive } = req.body;

  // Prevent removing the last active admin
  if ((role && role !== 'ADMIN') || isActive === false) {
    if (user.role === 'ADMIN') {
      const activeAdmins = await User.countDocuments({ role: 'ADMIN', isActive: true, _id: { $ne: user._id } });
      if (activeAdmins === 0)
        return res.status(400).json({ error: 'Cannot demote/deactivate the last active admin' });
    }
  }

  if (role) user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;

  if (baseId !== undefined) {
    if (baseId === null) user.baseId = null;
    else if (mongoose.isValidObjectId(baseId)) user.baseId = baseId;
    else return res.status(400).json({ error: 'Invalid baseId' });
  }

  // Re-validate invariant: non-admin must have base
  if (user.role !== 'ADMIN' && !user.baseId)
    return res.status(400).json({ error: 'Non-admin users must be assigned to a base' });

  await user.save();
  const populated = await user.populate('baseId', 'name');
  res.json(shape(populated));
});

// POST /api/users/:id/password — reset password
router.post('/:id/password', validate(passwordSchema), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'Invalid user id' });

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.passwordHash = await bcrypt.hash(req.body.password, 10);
  await user.save();

  res.json({ ok: true });
});

// DELETE /api/users/:id — hard delete (prefer PATCH isActive=false in practice)
router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: 'Invalid user id' });

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role === 'ADMIN') {
    const activeAdmins = await User.countDocuments({ role: 'ADMIN', isActive: true, _id: { $ne: user._id } });
    if (activeAdmins === 0)
      return res.status(400).json({ error: 'Cannot delete the last active admin' });
  }

  await user.deleteOne();
  res.json({ ok: true });
});

export default router;