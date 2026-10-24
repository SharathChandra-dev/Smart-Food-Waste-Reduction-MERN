import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, projectDir, ''), ...loadEnv(mode, path.join(projectDir, 'server'), '') };
  const apiTarget = process.env.SFWR_API_TARGET || env.SFWR_API_TARGET || `http://localhost:${process.env.PORT || env.PORT || 5002}`;
  return { plugins: [react()], server: { port: 5174, proxy: { '/api': apiTarget, '/uploads': apiTarget } } };
});
