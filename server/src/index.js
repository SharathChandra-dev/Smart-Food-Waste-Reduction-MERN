import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import api from './routes/api.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(serverDir, '../..');
dotenv.config({ path: path.join(serverDir, '../.env') });
dotenv.config({ path: path.join(projectDir, '.env'), override: false });
const app = express();
const port = Number(process.env.PORT || 5002);
fs.mkdirSync(path.resolve('uploads'), { recursive: true });
app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://ui-avatars.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
  }),
);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5174', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '7d', immutable: true }));
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
);
app.use('/api', api);
const clientDist = path.resolve(serverDir, '../../client/dist');
if (fs.existsSync(clientDist)) app.use(express.static(clientDist));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  const appIndex = path.join(clientDist, 'index.html');
  if (fs.existsSync(appIndex)) return res.sendFile(appIndex);
  return res.status(404).send('Build the React client with `npm run build --prefix client`.');
});
app.use((req, res) =>
  res.status(404).json({ message: `No API route for ${req.method} ${req.path}` }),
);
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === 11000)
    return res.status(409).json({ message: 'This value is already in use.' });
  if (error.name === 'ValidationError' || error.name === 'CastError')
    return res.status(422).json({ message: error.message });
  if (error.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ message: 'Image must be 2 MB or smaller.' });
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')
    return res.status(401).json({ message: 'Your verification session expired. Sign in again.' });
  if (error.code === 'SMTP_NOT_CONFIGURED') return res.status(503).json({ message: error.message });
  res.status(error.status || 500).json({ message: error.message || 'Unexpected server error.' });
});

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('Set JWT_SECRET to a random secret at least 32 characters long in server/.env.');
    process.exit(1);
  }
  process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn(
    'JWT_SECRET is unset; using an ephemeral development key. Set a persistent value in server/.env.',
  );
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  if (process.env.NODE_ENV === 'production') {
    console.error('Set MONGODB_URI in server/.env.');
    process.exit(1);
  }
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/sfwr_foodshare';
  console.log('MONGODB_URI is unset; using local MongoDB at 127.0.0.1:27017.');
}
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    const server = app.listen(port, () =>
      console.log(`SFWR API listening on http://localhost:${port}`),
    );
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE')
        console.error(`Port ${port} is already in use. Set a different PORT in .env and restart.`);
      else console.error('API server failed to start:', error.message);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB:', error.message);
    process.exit(1);
  });
