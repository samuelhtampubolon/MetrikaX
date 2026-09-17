import { ShapeMismatch } from '../errors.ts';

/** engine.helper_functions.dot */
export function dot(a: readonly number[], b: readonly number[]): number {
  if (a.length < 1) {
    throw new ShapeMismatch({
      id: 'Hasil kali titik memerlukan sekurang kurangnya satu unsur pada setiap vektor.',
      en: 'The dot product requires at least one element in each vector.',
    });
  }
  if (a.length !== b.length) {
    throw new ShapeMismatch({
      id: `Panjang kedua vektor berbeda: ${a.length} dan ${b.length}.`,
      en: `The two vectors have different lengths: ${a.length} and ${b.length}.`,
    });
  }
  let total = 0;
  for (let index = 0; index < a.length; index += 1) {
    total += (a[index] as number) * (b[index] as number);
  }
  return total;
}

/** engine.helper_functions.matvec */
export function matvec(m: readonly (readonly number[])[], v: readonly number[]): number[] {
  if (m.length < 1) {
    throw new ShapeMismatch({
      id: 'Matriks tidak memiliki baris.',
      en: 'The matrix has no rows.',
    });
  }
  return m.map((row, rowIndex) => {
    if (row.length !== v.length) {
      throw new ShapeMismatch({
        id: `Panjang baris ${rowIndex + 1} adalah ${row.length}, sedangkan panjang vektor adalah ${v.length}.`,
        en: `Row ${rowIndex + 1} has length ${row.length} while the vector has length ${v.length}.`,
      });
    }
    return dot(row, v);
  });
}

/** Sum a vector. Used by the weighted-screening and QFD relations. */
export function sum(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}
