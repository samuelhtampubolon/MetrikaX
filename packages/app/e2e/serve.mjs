#!/usr/bin/env node
/**
 * A static file server for the end to end suite, written by hand rather than pulled in.
 *
 * It serves exactly the built directory and nothing else, refuses any path that escapes it, and
 * adds the same security headers a real deployment should carry. Adding a package for twenty lines
 * of well understood code would be a dependency to audit for no gain.
 */

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const port = Number(process.argv[2] ?? 4173);
const root = resolve(import.meta.dirname, '../../../docs');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const requested = decodeURIComponent(url.pathname);

  // Resolve inside the root and refuse anything that climbs out of it.
  const candidate = resolve(join(root, normalize(requested)));
  if (candidate !== root && !candidate.startsWith(root + sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  let target = candidate;
  try {
    if (statSync(target).isDirectory()) target = join(target, 'index.html');
  } catch {
    response.writeHead(404).end('Not found');
    return;
  }

  let size = 0;
  try {
    size = statSync(target).size;
  } catch {
    response.writeHead(404).end('Not found');
    return;
  }

  response.writeHead(200, {
    'content-type': TYPES[extname(target)] ?? 'application/octet-stream',
    'content-length': String(size),
    // The headers a deployment of this application should carry. The page loads nothing from
    // anywhere else, so the policy can be this tight without breaking it.
    'content-security-policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; " +
      "base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
    'permissions-policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
    'service-worker-allowed': '/',
  });
  createReadStream(target).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`serving ${root} on http://127.0.0.1:${port}/\n`);
});
