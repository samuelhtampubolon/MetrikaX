/**
 * The desktop configuration, checked here so a mistake in it fails in a second rather than after
 * three runners have compiled sqlx, wry and webview2.
 *
 * The security assertions are the point. `connect-src 'none'` and an absent HTTP plugin are what
 * make the offline claim structural rather than a matter of discipline, and a change that quietly
 * relaxed either would otherwise only show up in a packet capture.
 */

import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const config = JSON.parse(
  readFileSync(resolve(ROOT, 'packages/desktop/src-tauri/tauri.conf.json'), 'utf8'),
) as {
  productName: string;
  identifier: string;
  app: {
    windows: {
      title: string;
      width: number;
      height: number;
      minWidth: number;
      minHeight: number;
      resizable: boolean;
      center: boolean;
      decorations: boolean;
    }[];
    security: { csp: string; freezePrototype: boolean; assetProtocol: { enable: boolean } };
  };
  bundle: {
    targets: string[];
    createUpdaterArtifacts: boolean;
    windows: { nsis: { installMode: string } };
  };
  plugins: Record<string, unknown>;
};

const cargoTomlSource = readFileSync(
  resolve(ROOT, 'packages/desktop/src-tauri/Cargo.toml'),
  'utf8',
);

/**
 * The manifest with its comments removed.
 *
 * The comments name the plugins that are deliberately absent, in order to say that they are
 * absent. Searching the raw text for those names finds the sentence explaining their absence and
 * reports it as their presence, so what is searched is the dependency list itself.
 */
const cargoToml = cargoTomlSource
  .split('\n')
  .map((line) => line.replace(/#.*$/, ''))
  .join('\n');
const capabilities = readFileSync(
  resolve(ROOT, 'packages/desktop/src-tauri/capabilities/default.json'),
  'utf8',
);

describe('the desktop configuration matches the specification', () => {
  it('carries the stated product name, identifier and window metrics', () => {
    expect(config.productName).toBe('MetriKa');
    expect(config.identifier).toBe('id.ac.local.metrika');

    const window = config.app.windows[0]!;
    expect(window.title).toBe('MetriKa');
    expect(window.width).toBe(980);
    expect(window.height).toBe(680);
    expect(window.minWidth).toBe(900);
    expect(window.minHeight).toBe(600);
    expect(window.resizable).toBe(true);
    expect(window.center).toBe(true);
    expect(window.decorations).toBe(true);
  });

  it('bundles the three stated targets and installs for the current user', () => {
    expect(config.bundle.targets).toEqual(['nsis', 'appimage', 'dmg']);
    // installMode currentUser is what lets the installer run without administrator rights.
    expect(config.bundle.windows.nsis.installMode).toBe('currentUser');
  });

  it('validates against the schema of the installed Tauri CLI', () => {
    // The check that would have caught allowToChangeInstallationDirectory, a field the
    // specification asks for and Tauri v2 does not have. See DEVIATIONS.md, D-20.
    expect(() =>
      execFileSync('node', [resolve(ROOT, 'scripts/check-tauri-config.mjs')], { stdio: 'pipe' }),
    ).not.toThrow();
  });
});

describe('the offline assertion holds by construction', () => {
  it('sets connect-src to none, so the webview cannot reach the network at all', () => {
    expect(config.app.security.csp).toContain("connect-src 'none'");
    expect(config.app.security.csp).toContain("default-src 'self'");
    expect(config.app.security.csp).toContain("object-src 'none'");
    expect(config.app.security.csp).toContain("frame-ancestors 'none'");
    // No 'unsafe-eval' anywhere: ADR-003 says the shipped application never parses a formula.
    expect(config.app.security.csp).not.toContain('unsafe-eval');
  });

  it('the manifest still explains which plugins are deliberately absent', () => {
    // The comments are stripped before the assertions below, so check they are still there: the
    // reason a capability is missing is worth more to the next reader than the absence itself.
    expect(cargoTomlSource).toContain('tauri-plugin-http');
    expect(cargoTomlSource).toMatch(/Notably absent/);
  });

  it('loads no HTTP plugin, so the capability is absent rather than merely unused', () => {
    expect(cargoToml).not.toMatch(/tauri-plugin-http/);
    expect(cargoToml).not.toMatch(/tauri-plugin-updater/);
    expect(cargoToml).not.toMatch(/tauri-plugin-shell/);
    expect(capabilities).not.toMatch(/"http:/);
    expect(capabilities).not.toMatch(/"shell:/);
  });

  it('loads only the two plugins the specification names', () => {
    const plugins = [...cargoToml.matchAll(/^tauri-plugin-([a-z-]+)/gm)].map((match) => match[1]);
    expect(plugins.sort()).toEqual(['dialog', 'sql']);
  });

  it('ships no updater, so nothing checks for a new version behind the reader', () => {
    expect(config.bundle.createUpdaterArtifacts).toBe(false);
  });

  it('freezes the prototype and disables the asset protocol', () => {
    expect(config.app.security.freezePrototype).toBe(true);
    expect(config.app.security.assetProtocol.enable).toBe(false);
  });

  it('grants no permission beyond the window, the two dialogs and the database', () => {
    const granted = (JSON.parse(capabilities) as { permissions: string[] }).permissions;
    for (const permission of granted) {
      expect(permission).toMatch(/^(core:|dialog:(allow-open|allow-save)|sql:)/);
    }
  });
});
