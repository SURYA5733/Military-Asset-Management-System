import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function authJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);

    // Re-check the user still exists and is active (handles deactivation mid-session)
    const user = await User.findById(payload.sub).select('username role baseId isActive');
    if (!user || user.isActive === false) {
      return res.status(401).json({ error: 'Account inactive or not found' });
    }

    req.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      baseId: user.baseId,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}