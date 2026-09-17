/**
 * Typed accessors that compiled formula bodies use to read the environment.
 *
 * A compiled expression never indexes the environment directly. It asks for a scalar or a vector by
 * name and receives a named error when the value is absent or the wrong shape, which keeps
 * principle P08 true at the innermost layer: the engine refuses rather than producing NaN.
 */

import { DomainViolation } from '../errors.ts';
import type { Env } from '../types.ts';

export function num(env: Env, variableId: string): number {
  const magnitude = env[variableId];
  if (magnitude === undefined) {
    throw new DomainViolation(
      {
        id: `Nilai ${variableId} belum tersedia pada lingkungan perhitungan.`,
        en: `The value ${variableId} is not present in the computation environment.`,
      },
      { variableIds: [variableId], code: 'domain_violation' },
    );
  }
  if (typeof magnitude !== 'number') {
    throw new DomainViolation(
      {
        id: `Nilai ${variableId} berbentuk deret, sedangkan rumus ini memerlukan satu angka.`,
        en: `The value ${variableId} is a series while this formula requires a single number.`,
      },
      { variableIds: [variableId], code: 'domain_violation' },
    );
  }
  if (!Number.isFinite(magnitude)) {
    throw new DomainViolation(
      {
        id: `Nilai ${variableId} tidak berhingga.`,
        en: `The value ${variableId} is not finite.`,
      },
      { variableIds: [variableId], code: 'non_finite' },
    );
  }
  return magnitude;
}

export function mat(env: Env, variableId: string): readonly (readonly number[])[] {
  const magnitude = env[variableId];
  if (magnitude === undefined) {
    throw new DomainViolation(
      {
        id: `Matriks ${variableId} belum tersedia pada lingkungan perhitungan.`,
        en: `The matrix ${variableId} is not present in the computation environment.`,
      },
      { variableIds: [variableId], code: 'domain_violation' },
    );
  }
  if (typeof magnitude === 'number' || !Array.isArray(magnitude)) {
    throw new DomainViolation(
      {
        id: `Nilai ${variableId} bukan matriks.`,
        en: `The value ${variableId} is not a matrix.`,
      },
      { variableIds: [variableId], code: 'domain_violation' },
    );
  }
  const rows = magnitude as readonly unknown[];
  const valid = rows.every(
    (row) =>
      Array.isArray(row) &&
      (row as readonly unknown[]).every(
        (entry) => typeof entry === 'number' && Number.isFinite(entry),
      ),
  );
  if (!valid) {
    throw new DomainViolation(
      {
        id: `Matriks ${variableId} memuat baris yang bukan deret angka berhingga.`,
        en: `The matrix ${variableId} contains a row that is not a series of finite numbers.`,
      },
      { variableIds: [variableId], code: 'non_finite' },
    );
  }
  return rows as readonly (readonly number[])[];
}

export function vec(env: Env, variableId: string): readonly number[] {
  const magnitude = env[variableId];
  if (magnitude === undefined) {
    throw new DomainViolation(
      {
        id: `Deret ${variableId} belum tersedia pada lingkungan perhitungan.`,
        en: `The series ${variableId} is not present in the computation environment.`,
      },
      { variableIds: [variableId], code: 'domain_violation' },
    );
  }
  if (typeof magnitude === 'number') {
    throw new DomainViolation(
      {
        id: `Nilai ${variableId} berupa satu angka, sedangkan rumus ini memerlukan deret.`,
        en: `The value ${variableId} is a single number while this formula requires a series.`,
      },
      { variableIds: [variableId], code: 'domain_violation' },
    );
  }
  const entries = magnitude as readonly unknown[];
  if (!entries.every((entry) => typeof entry === 'number' && Number.isFinite(entry))) {
    throw new DomainViolation(
      {
        id: `Deret ${variableId} memuat unsur yang bukan angka berhingga.`,
        en: `The series ${variableId} contains an entry that is not a finite number.`,
      },
      { variableIds: [variableId], code: 'non_finite' },
    );
  }
  return entries as readonly number[];
}
