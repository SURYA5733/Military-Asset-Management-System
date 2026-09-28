import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { auditLog } from '../middleware/audit.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', validate(loginSchema), auditLog, async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).populate('baseId', 'name');

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { sub: user._id, username: user.username, role: user.role, baseId: user.baseId?._id ?? user.baseId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      baseId: user.baseId?._id ?? user.baseId,
      baseName: user.baseId?.name ?? null,
    },
  });
});

export default router;