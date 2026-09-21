import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The portable single file build.
 *
 * A browser refuses to load an ES module script over `file://`, so the ordinary build cannot be
 * opened by double-clicking `index.html` off a flash drive: every asset request is blocked as a
 * cross-origin read from an opaque origin. That matters here more than it would elsewhere.
 * `desktop.portable_build.why_it_matters` says campus and corporate machines in Indonesia
 * frequently forbid installation, and a machine that forbids installation may also have no way to
 * run a local server.
 *
 * This build emits one file, `metrika-offline.html`, with the script and the stylesheet inlined.
 * An inline module is executed rather than fetched, so it runs from `file://`. Dynamic imports are
 * flattened into the same file for the same reason.
 *
 * Storage in this mode is whatever the browser allows. A `file://` page has an opaque origin and is
 * usually refused IndexedDB, so the application falls back to memory and the status bar says that
 * progress will not persist. Anyone who needs their work kept should use the desktop build, which
 * writes SQLite beside the executable.
 */
function inlineEverything(outDir: string, target: string): Plugin {
  return {
    name: 'metrika-portable-single-file',
    apply: 'build',
    enforce: 'post',
    writeBundle(_options, bundle) {
      const scripts: string[] = [];
      const styles: string[] = [];

      for (const [name, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk') scripts.push(chunk.code);
        else if (name.endsWith('.css')) styles.push(String(chunk.source));
      }

      if (scripts.length !== 1) {
        this.error(
          `The portable build must produce exactly one script, produced ${scripts.length}. ` +
            `A second chunk means a dynamic import was not inlined, and it would fail over file://.`,
        );
      }

      const html = readFileSync(resolve(outDir, 'index.html'), 'utf8');

      const single = html
        // Drop the tags that point at separate files, and the manifest, which a file:// page
        // cannot use either.
        .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>\s*/g, '')
        .replace(/<link[^>]*rel="stylesheet"[^>]*>\s*/g, '')
        .replace(/<link[^>]*rel="manifest"[^>]*>\s*/g, '')
        // The favicon is a separate file, which this page cannot reach and does not need.
        .replace(/<link[^>]*rel="icon"[^>]*>\s*/g, '')
        // A file:// page has no origin, so a policy written in terms of 'self' would block its own
        // inline script. The protection that matters here is the one that still applies: nothing
        // may be loaded or sent anywhere.
        .replace(
          /<meta\s+http-equiv="Content-Security-Policy"[^>]*>/,
          `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`,
        )
        // The replacements below pass a function rather than a string. A string replacement
        // treats $&, $` and $' as substitution patterns, and minified JavaScript is full of $,
        // which silently corrupts the inlined code into a syntax error. Found the hard way.
        .replace('</head>', () => `  <style>\n${styles.join('\n')}\n  </style>\n  </head>`)
        .replace(
          '</body>',
          () => `  <script type="module">\n${scripts[0] as string}\n  </script>\n  </body>`,
        );

      writeFileSync(target, single, 'utf8');
      rmSync(outDir, { recursive: true, force: true });

      const kb = (single.length / 1024).toFixed(0);
      this.warn(`portable single file written: docs/metrika-offline.html, ${kb} kB`);
    },
  };
}

const OUT = resolve(import.meta.dirname, 'dist-portable');
const TARGET = resolve(import.meta.dirname, '../../docs/metrika-offline.html');

export default defineConfig({
  plugins: [react(), inlineEverything(OUT, TARGET)],
  base: './',
  build: {
    outDir: OUT,
    emptyOutDir: true,
    target: 'es2022',
    // Everything goes in the HTML, so nothing may be emitted as a separate asset.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    sourcemap: false,
    // One chunk, so nothing is left to fetch: a dynamic import would be a separate file and
    // would fail over file://.
    rolldownOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
});
