// Copyright © 2026 Samuel Hasudungan Tampubolon. MIT License, see LICENSE.
/**
 * Deployment configuration tests.
 *
 * The application is served from five kinds of host, and four of them take their security headers
 * from a file in this repository. A policy that says one thing in vercel.json and another in
 * _headers is a policy that is only true on one host, so the tests below hold every copy to the
 * same string, and hold that string to the promises SECURITY.md makes.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../../..');
const read = (path: string): string => readFileSync(resolve(ROOT, path), 'utf8');

/** The one policy. serve.mjs, which the browser tests run against, is the reference copy. */
const POLICY =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
  "font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; " +
  "frame-ancestors 'none'";

const COPIES = ['packages/app/public/_headers', 'vercel.json', 'firebase.json'] as const;

describe('the security policy is the same everywhere it is written down', () => {
  it('appears word for word in the reference server', () => {
    const server = read('packages/app/e2e/serve.mjs').replace(/['"]\s*\+\s*\n\s*['"]/g, '');
    for (const directive of POLICY.split('; ')) {
      expect(server, directive).toContain(directive.replace(/;$/, ''));
    }
  });

  for (const path of COPIES) {
    it(`appears word for word in ${path}`, () => {
      expect(read(path)).toContain(POLICY);
    });
  }

  it('names no origin other than itself, so no host can be quietly allowed', () => {
    expect(POLICY).not.toMatch(/https?:|\*|\bdata:(?! *;)/);
    expect(POLICY).not.toContain('unsafe-eval');
    // The only inline allowance is for styles, which React writes as attributes.
    expect(POLICY.match(/unsafe-inline/g)).toHaveLength(1);
  });

  it('forbids framing, which a meta tag cannot and a header can', () => {
    expect(POLICY).toContain("frame-ancestors 'none'");
    expect(read('packages/app/index.html')).not.toContain('frame-ancestors');
  });
});

describe('the other headers', () => {
  for (const path of COPIES) {
    it(`${path} carries the full set`, () => {
      const text = read(path).toLowerCase();
      for (const header of [
        'x-content-type-options',
        'referrer-policy',
        'cross-origin-opener-policy',
        'permissions-policy',
        'strict-transport-security',
      ]) {
        expect(text, header).toContain(header);
      }
      expect(text).toContain('nosniff');
    });

    it(`${path} never caches the service worker, or a new build could not reach anyone`, () => {
      const text = read(path);
      expect(text).toMatch(/sw\.js/);
      expect(text).toContain('no-cache');
    });
  }
});

describe('the configuration files', () => {
  it('vercel.json and firebase.json are valid JSON', () => {
    expect(() => JSON.parse(read('vercel.json'))).not.toThrow();
    expect(() => JSON.parse(read('firebase.json'))).not.toThrow();
  });

  it('every host publishes the folder the web build writes to', () => {
    expect(read('packages/app/vite.config.ts')).toContain("outDir: '../../docs'");
    expect(JSON.parse(read('vercel.json')).outputDirectory).toBe('docs');
    expect(JSON.parse(read('firebase.json')).hosting.public).toBe('docs');
    expect(read('netlify.toml')).toMatch(/publish\s*=\s*"docs"/);
    expect(read('wrangler.toml')).toMatch(/pages_build_output_dir\s*=\s*"docs"/);
  });

  it('every host builds only the web app, not the desktop shell or the portable file', () => {
    expect(JSON.parse(read('vercel.json')).buildCommand).toBe(
      'pnpm --filter @metrika/app run build',
    );
    expect(read('netlify.toml')).toContain('pnpm --filter @metrika/app run build');
  });

  it('every host installs from the lockfile, so what is built is what was audited', () => {
    expect(JSON.parse(read('vercel.json')).installCommand).toContain('--frozen-lockfile');
    expect(read('netlify.toml')).toContain('--frozen-lockfile');
    expect(JSON.stringify(JSON.parse(read('firebase.json')).hosting.predeploy)).toContain(
      '--frozen-lockfile',
    );
  });

  it('_headers uses comments that the hosts understand, and path rules that start with a slash', () => {
    const lines = read('packages/app/public/_headers').split('\n');
    for (const line of lines) {
      if (line.trim() === '' || line.startsWith('#') || line.startsWith('  ')) continue;
      expect(line, 'a top level line that is neither a comment nor a path').toMatch(/^\//);
    }
  });

  it('the Cloudflare configuration binds no D1, R2 or KV, since nothing may be sent anywhere', () => {
    const live = read('wrangler.toml')
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n');
    expect(live).not.toMatch(/d1_databases|r2_buckets|kv_namespaces/);
  });
});

describe('the Hugging Face Space', () => {
  const front = read('deploy/huggingface/README.md').split('---')[1] ?? '';

  it('is a static Space, which can serve nothing but files', () => {
    expect(front).toContain('sdk: static');
  });

  it('declares the licence the repository declares', () => {
    expect(front).toContain('license: mit');
  });
});

describe('no insecure link is left in the files a person reads or a build ships', () => {
  const FILES = [
    'README.md',
    'SECURITY.md',
    'NOTICE',
    'packages/app/index.html',
    'packages/app/public/manifest.webmanifest',
    'deploy/README.md',
    'vercel.json',
    'firebase.json',
    'netlify.toml',
    'wrangler.toml',
  ];

  for (const path of FILES) {
    it(`${path} has no http:// link`, () => {
      const links = read(path).match(/http:\/\/[^\s"')<]+/g) ?? [];
      // Namespaces are identifiers, not addresses that anything fetches.
      expect(links.filter((link) => !/w3\.org|localhost|127\.0\.0\.1/.test(link))).toEqual([]);
    });
  }
});
