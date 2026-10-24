import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export async function auth(req, res, next) {
  try {
    const token = req.cookies?.sfwr_token || req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.challenge)
      return res.status(401).json({ message: 'Complete two-factor verification first.' });
    const user = await User.findById(payload.sub);
    if (!user)
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

export function admin(req, res, next) {
  if (req.user?.role_sfwr !== 'Admin')
    return res.status(403).json({ message: 'Admin access required.' });
  next();
}
