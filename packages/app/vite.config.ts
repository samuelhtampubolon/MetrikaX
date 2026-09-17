import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * P23: write the precache manifest into the service worker after the bundle is emitted.
 *
 * The list is taken from what the build actually produced rather than guessed, so the shell cached
 * on a first visit is the whole shell. The cache name carries a hash of that list, so a new build
 * invalidates the old cache wholesale rather than leaving two builds mixed together.
 */
function serviceWorkerManifest(): Plugin {
  return {
    name: 'metrika-service-worker-manifest',
    apply: 'build',
    enforce: 'post',
    writeBundle(options, bundle) {
      const outDir = options.dir ?? resolve(process.cwd(), '../../docs');
      const assets = Object.keys(bundle)
        .filter((name) => name !== 'sw.js')
        .map((name) => `./${name}`);

      const precache = ['./', './index.html', './manifest.webmanifest', './icon.svg', ...assets];
      const unique = [...new Set(precache)].sort();
      const buildId = createHash('sha256').update(unique.join('\n')).digest('hex').slice(0, 12);

      const swPath = resolve(outDir, 'sw.js');
      const source = readFileSync(swPath, 'utf8')
        .replace('__BUILD_ID__', buildId)
        .replace('__PRECACHE__', JSON.stringify(unique, null, 2));

      writeFileSync(swPath, source, 'utf8');
      this.warn(`service worker precaches ${unique.length} files as metrika-${buildId}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorkerManifest()],
  // The web build is served from a subdirectory on GitHub Pages and from the file system inside
  // the desktop shell, so every asset reference is relative.
  base: './',
  build: {
    outDir: '../../docs',
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
});
