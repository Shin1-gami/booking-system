import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Router } from 'express';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROUTE_PREFIX_MAP = [
  { match: /^auth/i, prefix: '/auth' },
  { match: /^user/i, prefix: '/users' },
  { match: /^categor/i, prefix: '/categories' },
  { match: /^resource/i, prefix: '/resources' },
  { match: /^booking/i, prefix: '/bookings' },
  { match: /^favorite/i, prefix: '/favorites' },
  { match: /^notification/i, prefix: '/notifications' },
  { match: /^file/i, prefix: '/files' },
  { match: /^upload/i, prefix: '/uploads' },
  { match: /^health/i, prefix: '/health' },
];

const routeFiles = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.js') && file !== 'index.js');

let hasHealthRoute = false;

for (const file of routeFiles) {
  const fileUrl = pathToFileURL(path.join(__dirname, file)).href;
  const mod = await import(fileUrl);
  const routeHandler = mod.default || mod.router;

  if (!routeHandler) continue;

  const matched = ROUTE_PREFIX_MAP.find((entry) => entry.match.test(file));
  if (matched) {
    if (matched.prefix === '/health') hasHealthRoute = true;
    router.use(matched.prefix, routeHandler);
  } else {
    const baseName = file.replace(/Routes?\.js$/i, '').replace(/\.js$/i, '').toLowerCase();
    const fallbackPrefix = baseName.endsWith('s') ? `/${baseName}` : `/${baseName}s`;
    router.use(fallbackPrefix, routeHandler);
  }
}

if (!hasHealthRoute) {
  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
}

export default router;