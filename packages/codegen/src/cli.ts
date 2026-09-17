/**
 * Codegen entry point.
 *
 * `generate` writes every generated source from spec/metrika.spec.json.
 * `verify` regenerates into memory and reports any file on disk that differs, which is the check
 * AC-17 requires and the one that makes hand-editing a generated file impossible to miss.
 *
 * Generation runs in two passes. The first emits the variable registry and the relation modules.
 * The second imports what it just wrote and computes the worked-example results, so the golden
 * tests are pinned to the behaviour of the emitted code rather than to a second implementation of
 * the same arithmetic.
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { REPO_ROOT, loadSpec } from './spec.ts';
import { emitVariables, type EmittedFile } from './emitVariables.ts';
import { emitFormulas } from './emitFormulas.ts';
import { emitGolden } from './emitGolden.ts';
import { emitLocale } from './emitLocale.ts';
import { resolveOutputs } from './outputs.ts';

const GENERATED_DIRECTORIES = [
  'packages/engine/src/variables/generated',
  'packages/engine/src/formulas/generated',
  'packages/engine/test/golden',
  'packages/app/src/locale/generated',
];

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'generate';
  if (command !== 'generate' && command !== 'verify') {
    console.error(`Unknown command: ${command}. Use generate or verify.`);
    process.exit(2);
  }

  const spec = loadSpec();
  assertCounts(spec);

  const locale = emitLocale(spec);
  const firstPass: EmittedFile[] = [...emitVariables(spec), ...emitFormulas(spec), ...locale.files];

  if (command === 'generate') {
    for (const directory of GENERATED_DIRECTORIES) {
      const absolute = resolve(REPO_ROOT, directory);
      if (existsSync(absolute)) rmSync(absolute, { recursive: true, force: true });
      mkdirSync(absolute, { recursive: true });
    }
    writeAll(firstPass);
  }

  // Second pass: read back what the first pass produced and compute the worked-example results.
  const indexPath = resolve(REPO_ROOT, 'packages/engine/src/formulas/generated/index.ts');
  const module = (await import(`${pathToFileURL(indexPath).href}?t=${Date.now()}`)) as {
    RELATIONS: ReadonlyMap<string, never>;
    FORMULA_COUNT: number;
  };
  const golden = emitGolden(spec, module.RELATIONS);

  const supportPath = 'packages/engine/test/support/assert.ts';
  const allFiles = [...firstPass, ...golden.files];

  if (command === 'generate') {
    writeAll(golden.files);
    report(spec, module.FORMULA_COUNT, golden.caseCount, locale);
    return;
  }

  let differences = 0;
  for (const file of allFiles) {
    const absolute = resolve(REPO_ROOT, file.path);
    if (!existsSync(absolute)) {
      console.error(`MISSING  ${file.path}`);
      differences += 1;
      continue;
    }
    if (readFileSync(absolute, 'utf8') !== file.contents) {
      console.error(`DIFFERS  ${file.path}`);
      differences += 1;
    }
  }

  const expected = new Set(allFiles.map((file) => resolve(REPO_ROOT, file.path)));
  for (const directory of GENERATED_DIRECTORIES) {
    const absolute = resolve(REPO_ROOT, directory);
    if (!existsSync(absolute)) continue;
    for (const entry of readdirSync(absolute)) {
      const candidate = resolve(absolute, entry);
      if (candidate === resolve(REPO_ROOT, supportPath)) continue;
      if (!expected.has(candidate)) {
        console.error(`UNEXPECTED  ${directory}/${entry}`);
        differences += 1;
      }
    }
  }

  if (differences > 0) {
    console.error(
      `\n${differences} generated file(s) differ from a fresh generation. Run pnpm codegen.`,
    );
    process.exit(1);
  }
  console.log(`verify: ${allFiles.length} generated files match a fresh generation.`);
}

function writeAll(files: readonly EmittedFile[]): void {
  for (const file of files) {
    const absolute = resolve(REPO_ROOT, file.path);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, file.contents, 'utf8');
  }
}

function assertCounts(spec: ReturnType<typeof loadSpec>): void {
  const formulaCount = spec.formula_registry.length;
  const variableCount = spec.canonical_variables.length;
  if (formulaCount !== 76) {
    throw new Error(`AC-01: the formula registry holds ${formulaCount} formulas, expected 76.`);
  }
  if (variableCount < 150) {
    throw new Error(
      `AC-03: the variable registry holds ${variableCount} variables, expected 150 or more.`,
    );
  }
  const ids = new Set(spec.formula_registry.map((formula) => formula.id));
  if (ids.size !== formulaCount) {
    throw new Error('Two formulas share an id.');
  }
}

function report(
  spec: ReturnType<typeof loadSpec>,
  formulaCount: number,
  caseCount: number,
  locale: { total: number; untranslated: number },
): void {
  const outputs = resolveOutputs(spec);
  const synthesised = [...outputs.values()].filter((output) => output.synthesised);
  const composite = [...outputs.values()].filter((output) => output.resultShape === 'composite');

  console.log('codegen complete');
  console.log(`  formulas emitted            ${formulaCount}`);
  console.log(`  canonical variables         ${spec.canonical_variables.length}`);
  console.log(`  synthesised result variables ${synthesised.length}`);
  console.log(
    `  composite results           ${composite.length} (${composite.map((entry) => entry.formulaId).join(', ')})`,
  );
  console.log(`  golden cases                ${caseCount}`);
  console.log(`  locale keys                 ${locale.total}`);
  console.log(`  without an English value    ${locale.untranslated} (see DEVIATIONS.md, D-13)`);
}

await main();
