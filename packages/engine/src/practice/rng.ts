/**
 * P17: the deterministic generator source.
 *
 * gamification.challenge_types asks that every generated item be reproducible from a seed. That is
 * not a convenience: an assessment whose items cannot be reproduced cannot be reviewed, disputed
 * or marked again, and a learner who is told their answer was wrong is owed the exact item they
 * were given.
 *
 * Math.random is therefore never called anywhere in this module or in the generators that use it.
 */

/** FNV-1a over the seed string, so any text is a starting state. */
function hash(seed: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

export interface Rng {
  /** The next value in [0, 1). */
  next: () => number;
  /** An integer in [0, bound). */
  int: (bound: number) => number;
  /** A value in [low, high). */
  between: (low: number, high: number) => number;
  /** One element, or undefined when the list is empty. */
  pick: <T>(items: readonly T[]) => T | undefined;
  /** A copy of the list in a shuffled order. The input is left alone. */
  shuffle: <T>(items: readonly T[]) => T[];
}

/**
 * mulberry32: thirty-two bits of state, one multiply and three shifts per draw.
 *
 * It is not a cryptographic generator and is not used as one. What it has to be is identical on
 * every machine that runs it, which it is: every operation is on a thirty-two bit integer.
 */
export function makeRng(seed: string): Rng {
  let state = hash(seed);

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (bound: number): number => (bound <= 0 ? 0 : Math.floor(next() * bound) % bound);

  return {
    next,
    int,
    between: (low, high) => low + next() * (high - low),
    pick: <T>(items: readonly T[]): T | undefined =>
      items.length === 0 ? undefined : items[int(items.length)],
    shuffle: <T>(items: readonly T[]): T[] => {
      const copy = [...items];
      for (let index = copy.length - 1; index > 0; index -= 1) {
        const swap = int(index + 1);
        const held = copy[index] as T;
        copy[index] = copy[swap] as T;
        copy[swap] = held;
      }
      return copy;
    },
  };
}
