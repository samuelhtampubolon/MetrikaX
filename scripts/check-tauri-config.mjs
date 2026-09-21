#!/usr/bin/env node
/**
 * Validate tauri.conf.json against the schema shipped with the installed Tauri CLI.
 *
 * This exists because of a failure it would have caught. The specification asks for an NSIS option,
 * `allowToChangeInstallationDirectory`, that Tauri v2 does not have, and nothing said so until a
 * three-platform release build had compiled sqlx, wry and webview2 on three runners and then died
 * on a field name. The check takes a moment and runs before any of that.
 *
 * It looks for one class of mistake, the one that actually happens: a property the schema does not
 * define, at a point where the schema says no others are allowed. Full schema validation would mean
 * a validator dependency; this is the part that pays.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = resolve(ROOT, 'packages/desktop/src-tauri/tauri.conf.json');
const SCHEMA = resolve(
  ROOT,
  'node_modules/.pnpm/@tauri-apps+cli@2.9.2/node_modules/@tauri-apps/cli/config.schema.json',
);

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
const schema = JSON.parse(readFileSync(SCHEMA, 'utf8'));

const problems = [];

/** Follow a $ref, and flatten the one-of branches a schema uses for optional shapes. */
function resolveNode(node, seen = new Set()) {
  if (node === undefined || node === null || typeof node !== 'object') return [];
  if (typeof node.$ref === 'string') {
    if (seen.has(node.$ref)) return [];
    seen.add(node.$ref);
    const path = node.$ref.replace(/^#\//, '').split('/');
    let target = schema;
    for (const part of path) target = target?.[part];
    return resolveNode(target, seen);
  }
  const branches = [node];
  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    for (const branch of node[key] ?? []) branches.push(...resolveNode(branch, seen));
  }
  return branches;
}

/**
 * Every property name the schema allows at this point, across all branches.
 *
 * A branch counts as open only when it actually describes an object and allows extra properties.
 * The Tauri schema wraps most nodes as `{ description, default, allOf: [{ $ref }] }`, and an
 * earlier version of this function read those wrappers as "no properties, so anything goes", which
 * made the whole check silently pass on everything. A wrapper describes nothing and now says
 * nothing.
 */
function allowedKeys(branches) {
  const keys = new Set();
  let open = false;

  for (const branch of branches) {
    const properties = branch.properties;
    const describesAnObject = properties !== undefined || branch.type === 'object';
    if (!describesAnObject) continue;

    for (const key of Object.keys(properties ?? {})) keys.add(key);
    if (branch.additionalProperties !== false) open = true;
  }

  return { keys, open };
}

function walk(value, node, path) {
  if (value === null || typeof value !== 'object') return;
  const branches = resolveNode(node);
  if (branches.length === 0) return;

  if (Array.isArray(value)) {
    const items = branches.map((branch) => branch.items).find((item) => item !== undefined);
    if (items === undefined) return;
    value.forEach((entry, index) => walk(entry, items, `${path}[${index}]`));
    return;
  }

  const { keys, open } = allowedKeys(branches);
  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith('$')) continue;
    if (!keys.has(key)) {
      if (!open && keys.size > 0) {
        problems.push({
          path: `${path}.${key}`,
          allowed: [...keys].sort().slice(0, 14),
        });
      }
      continue;
    }
    const childNode = branches
      .map((branch) => branch.properties?.[key])
      .find((entry) => entry !== undefined);
    walk(child, childNode, `${path}.${key}`);
  }
}

walk(config, schema, 'tauri.conf');

if (problems.length > 0) {
  console.error(`tauri.conf.json has ${problems.length} field(s) the schema does not define:\n`);
  for (const problem of problems) {
    console.error(`  ${problem.path}`);
    console.error(`      the schema allows: ${problem.allowed.join(', ')}\n`);
  }
  process.exit(1);
}

console.error('tauri.conf.json matches the schema of the installed Tauri CLI.');
