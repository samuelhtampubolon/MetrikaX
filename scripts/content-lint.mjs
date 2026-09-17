#!/usr/bin/env node
/**
 * AC-14 and philosophy.design_doctrine.the_humility_paradox.test.
 *
 * The forbidden adjectives must appear zero times in user-facing content.
 *
 * Two decisions shape this check, and both are recorded in DEVIATIONS.md as D-05.
 *
 * First, matching is by whole word. The specification's own axis A is named "tangga kecanggihan",
 * the sophistication ladder, and that word contains "canggih". Substring matching would fail the
 * build on 76 formula definitions for a structural term that describes how hard a formula is to
 * master, which is not the self-congratulation the rule exists to prevent. A whole-word match still
 * catches every use of "canggih" as an adjective for the software itself.
 *
 * Second, the passages that name the forbidden words in order to forbid them are skipped. A rule
 * cannot be written down without writing down what it forbids.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, statSync, existsSync } from 'node:fs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_PATH = resolve(REPO_ROOT, 'spec/metrika.spec.json');

/** Paths inside the specification that define the rule rather than being subject to it. */
const RULE_DEFINING_PATHS = [
  'locale.forbidden_words_in_all_content',
  'locale.forbidden_word_check',
  'philosophy.design_doctrine.the_humility_paradox',
  'philosophy.design_doctrine.explicitly_forbidden_visual_traits',
];

/** Directories of authored content that the check also covers once they exist. */
const CONTENT_DIRECTORIES = ['packages/app/src/locale', 'packages/app/src/curriculum', 'content'];

const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf8'));
const forbidden = spec.locale.forbidden_words_in_all_content;

const findings = [];

walk(spec, '');
for (const directory of CONTENT_DIRECTORIES) {
  const absolute = resolve(REPO_ROOT, directory);
  if (!existsSync(absolute)) continue;
  for (const file of filesUnder(absolute)) {
    scan(readFileSync(file, 'utf8'), file.slice(REPO_ROOT.length + 1));
  }
}

if (findings.length > 0) {
  console.error(`Forbidden adjective check failed with ${findings.length} occurrence(s):\n`);
  for (const finding of findings.slice(0, 40)) {
    console.error(`  ${finding.word}  at  ${finding.where}`);
    console.error(`      ${finding.excerpt}`);
  }
  process.exit(1);
}

console.error(
  `Forbidden adjective check passed: zero whole-word occurrences of ` +
    `${forbidden.length} forbidden terms across the specification and the content directories.`,
);

function walk(node, path) {
  if (typeof node === 'string') {
    scan(node, path);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((entry, index) => walk(entry, `${path}[${index}]`));
    return;
  }
  if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      const next = path === '' ? key : `${path}.${key}`;
      if (RULE_DEFINING_PATHS.some((skip) => next === skip || next.startsWith(`${skip}.`)))
        continue;
      walk(value, next);
    }
  }
}

function scan(text, where) {
  const lowered = text.toLowerCase();
  for (const word of forbidden) {
    const pattern = new RegExp(
      `(?<![\\p{L}\\p{N}])${escape(word.toLowerCase())}(?![\\p{L}\\p{N}])`,
      'u',
    );
    const match = pattern.exec(lowered);
    if (match === null) continue;
    const start = Math.max(0, match.index - 40);
    findings.push({
      word,
      where,
      excerpt: text.slice(start, match.index + word.length + 40).replace(/\s+/g, ' '),
    });
  }
}

function escape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function filesUnder(directory) {
  const out = [];
  for (const entry of readdirSync(directory)) {
    const full = resolve(directory, entry);
    if (statSync(full).isDirectory()) out.push(...filesUnder(full));
    else if (/\.(ts|tsx|md|json)$/.test(entry)) out.push(full);
  }
  return out;
}
