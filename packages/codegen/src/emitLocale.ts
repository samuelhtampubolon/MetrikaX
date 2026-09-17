/**
 * P15 groundwork: emit the locale catalogues from the specification.
 *
 * ADR-006 states that internationalisation is present from the first commit and is never
 * retrofitted, so this runs before the screens are built rather than after. No user-visible string
 * is written inline in a component; every one lives here with an id.
 *
 * locale.string_id_convention: screen.component.purpose, lower snake, for example calc.result.label.
 * Data-derived ids follow the same shape with the entity as the first segment, for example
 * formula.ctr.name and variable.impressions.label.
 *
 * The specification supplies English for a formula name, a formula definition and a variable label.
 * It supplies Indonesian only for band labels, band guidance, failure modes, controls and variable
 * definitions: 801 strings in total. Those are emitted into the English catalogue with their
 * Indonesian text and listed in UNTRANSLATED, so the gap is one exported array a test can measure
 * rather than a silence. Translating them is authoring work and belongs to the owner.
 * See DEVIATIONS.md, D-13.
 */

import { GENERATED_HEADER, type Spec } from './spec.ts';
import { quote } from './emitVariables.ts';
import type { EmittedFile } from './emitVariables.ts';

interface Entry {
  readonly key: string;
  readonly id: string;
  readonly en: string | null;
}

export interface LocaleSummary {
  readonly files: EmittedFile[];
  readonly total: number;
  readonly untranslated: number;
}

export function emitLocale(spec: Spec): LocaleSummary {
  const entries: Entry[] = [];
  const push = (key: string, id: string, en: string | null): void => {
    entries.push({ key, id, en });
  };

  for (const formula of spec.formula_registry) {
    push(`formula.${formula.id}.name`, formula.name.id, formula.name.en);
    push(`formula.${formula.id}.symbol`, formula.symbol, formula.symbol);
    push(`formula.${formula.id}.definition`, formula.definition.id, formula.definition.en);

    formula.interpretation_bands.forEach((band, index) => {
      push(`formula.${formula.id}.band.${index}.label`, band.label, null);
      push(`formula.${formula.id}.band.${index}.guidance`, band.guidance_id, null);
    });
    formula.failure_modes.forEach((mode, index) => {
      push(`formula.${formula.id}.pitfall.${index}`, mode.description_id, null);
    });
    formula.controls.forEach((control, index) => {
      push(`formula.${formula.id}.control.${index}`, control.description_id, null);
    });
  }

  for (const variable of spec.canonical_variables) {
    push(`variable.${variable.id}.label`, variable.label.id, variable.label.en);
    push(`variable.${variable.id}.definition`, variable.definition_id, null);
  }

  for (const module of spec.curriculum) {
    push(`curriculum.${module.module}.name`, module.name.id, module.name.en);
  }

  entries.sort((a, b) => a.key.localeCompare(b.key));

  const untranslated = entries.filter((entry) => entry.en === null).map((entry) => entry.key);
  const render = (pick: (entry: Entry) => string): string =>
    entries.map((entry) => `  ${quote(entry.key)}: ${quote(pick(entry))},`).join('\n');

  const idFile = `${GENERATED_HEADER}
/** Indonesian catalogue, drawn from spec/metrika.spec.json. */
export const idCatalogue: Readonly<Record<string, string>> = Object.freeze({
${render((entry) => entry.id)}
});
`;

  const enFile = `${GENERATED_HEADER}
/**
 * English catalogue, drawn from spec/metrika.spec.json.
 *
 * Where the specification carries no English value, the Indonesian text stands in and the key is
 * listed in UNTRANSLATED below. A reader can therefore count the gap exactly rather than discover
 * it one screen at a time.
 */
export const enCatalogue: Readonly<Record<string, string>> = Object.freeze({
${render((entry) => entry.en ?? entry.id)}
});

/** Keys whose English value is the Indonesian text because the specification supplies no other. */
export const UNTRANSLATED: readonly string[] = Object.freeze([
${untranslated.map((key) => `  ${quote(key)},`).join('\n')}
]);
`;

  return {
    files: [
      { path: 'packages/app/src/locale/generated/id.ts', contents: idFile },
      { path: 'packages/app/src/locale/generated/en.ts', contents: enFile },
    ],
    total: entries.length,
    untranslated: untranslated.length,
  };
}
