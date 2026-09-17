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

/**
 * Transpose a matrix.
 *
 * The QFD relation needs it: its relationship matrix is indexed by customer need down the rows and
 * by technical characteristic across the columns, while the weighting runs over the needs. See
 * DEVIATIONS.md, D-04.
 */
export function transpose(m: readonly (readonly number[])[]): number[][] {
  if (m.length < 1) {
    throw new ShapeMismatch({
      id: 'Matriks tidak memiliki baris.',
      en: 'The matrix has no rows.',
    });
  }
  const width = (m[0] as readonly number[]).length;
  for (const [index, row] of m.entries()) {
    if (row.length !== width) {
      throw new ShapeMismatch({
        id: `Panjang baris ${index + 1} adalah ${row.length}, sedangkan baris pertama memiliki panjang ${width}.`,
        en: `Row ${index + 1} has length ${row.length} while the first row has length ${width}.`,
      });
    }
  }
  return Array.from({ length: width }, (_unused, column) => m.map((row) => row[column] as number));
}

/** Sum a vector. Used by the weighted-screening and QFD relations. */
export function sum(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}
