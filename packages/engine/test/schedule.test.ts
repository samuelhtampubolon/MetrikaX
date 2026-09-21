/**
 * P18 tests for the scheduler and the mastery state machine.
 *
 * The definition of done for the phase is that a formula moves from introduced to mastered through
 * the correct number of varied correct answers. Varied is the word being tested: four correct
 * answers to the same kind of question must not master anything, because that proves only that the
 * shape has become familiar.
 */

import { describe, expect, it } from 'vitest';
import {
  RELATIONS,
  applyAttempt,
  dueFor,
  experienceFor,
  initialRecord,
  introduce,
  nextTypeFor,
  stateAt,
  DISTINCT_TYPES_FOR_MASTERY,
  INTERVALS_DAYS,
  type ItemType,
  type ProgressRecord,
  type Relation,
} from '../src/index.ts';

const START = new Date('2026-01-01T09:00:00.000Z');
const DAY = 86_400_000;

function at(days: number): Date {
  return new Date(START.getTime() + days * DAY);
}

/** Answer correctly `times` times, cycling through the kinds of question given. */
function run(
  record: ProgressRecord,
  types: readonly ItemType[],
  times: number,
  correct = true,
): ProgressRecord {
  let current = record;
  for (let index = 0; index < times; index += 1) {
    current = applyAttempt(current, {
      type: types[index % types.length] as ItemType,
      correct,
      now: at(index),
    }).record;
  }
  return current;
}

describe('the mastery state machine', () => {
  it('starts every formula unseen, with nothing due', () => {
    const record = initialRecord('ctr');
    expect(record.state).toBe('unseen');
    expect(record.nextReviewAt).toBeNull();
    expect(record.streak).toBe(0);
  });

  it('moves to mastered after the threshold the formula declares, across three kinds of question', () => {
    const relation = RELATIONS.get('ctr') as Relation;
    const threshold = relation.gamification.masteryThreshold;
    expect(threshold).toBeGreaterThanOrEqual(3);

    const types: ItemType[] = ['forward_compute', 'inverse_solve', 'spot_the_error'];
    const before = run(introduce(initialRecord('ctr'), START), types, threshold - 1);
    expect(before.state).toBe('practising');

    const after = applyAttempt(before, { type: 'interpret_the_band', correct: true, now: at(9) });
    expect(after.record.state).toBe('mastered');
    expect(after.promoted).toBe(true);
    expect(after.record.streak).toBe(threshold);
  });

  it('refuses to master a formula answered through one kind of question alone', () => {
    const record = run(introduce(initialRecord('ctr'), START), ['forward_compute'], 8);
    expect(record.streak).toBe(8);
    expect(record.typesInStreak).toHaveLength(1);
    expect(record.state).toBe('practising');
  });

  it('needs three distinct kinds, no fewer', () => {
    const record = run(
      introduce(initialRecord('ctr'), START),
      ['forward_compute', 'inverse_solve'],
      8,
    );
    expect(record.typesInStreak.length).toBeLessThan(DISTINCT_TYPES_FOR_MASTERY);
    expect(record.state).toBe('practising');
  });

  it('reports the promotion once, not on every later answer', () => {
    const types: ItemType[] = [
      'forward_compute',
      'inverse_solve',
      'spot_the_error',
      'cpa' as ItemType,
    ];
    let record = introduce(initialRecord('ctr'), START);
    let promotions = 0;
    for (let index = 0; index < 8; index += 1) {
      const outcome = applyAttempt(record, {
        type: types[index % 3] as ItemType,
        correct: true,
        now: at(index),
      });
      record = outcome.record;
      if (outcome.promoted) promotions += 1;
    }
    expect(promotions).toBe(1);
  });
});

describe('what a wrong answer costs', () => {
  const mastered = run(
    introduce(initialRecord('ctr'), START),
    ['forward_compute', 'inverse_solve', 'spot_the_error'],
    6,
  );

  it('takes the streak back to zero and returns the formula to practising', () => {
    const after = applyAttempt(mastered, {
      type: 'forward_compute',
      correct: false,
      now: at(7),
    }).record;

    expect(after.streak).toBe(0);
    expect(after.typesInStreak).toHaveLength(0);
    expect(after.state).toBe('practising');
  });

  it('never subtracts experience, and never awards any either', () => {
    const outcome = applyAttempt(mastered, { type: 'forward_compute', correct: false, now: at(7) });
    expect(outcome.xpAwarded).toBe(0);
    expect(outcome.record.xp).toBe(mastered.xp);
  });

  it('brings the next review back to the first interval', () => {
    const after = applyAttempt(mastered, {
      type: 'forward_compute',
      correct: false,
      now: at(7),
    }).record;

    expect(after.intervalIndex).toBe(0);
    expect(Date.parse(after.nextReviewAt as string) - at(7).getTime()).toBe(
      (INTERVALS_DAYS[0] as number) * DAY,
    );
  });

  it('counts the attempt, so the record says how much work was done', () => {
    const after = applyAttempt(mastered, {
      type: 'forward_compute',
      correct: false,
      now: at(7),
    }).record;
    expect(after.attempts).toBe(mastered.attempts + 1);
    expect(after.correct).toBe(mastered.correct);
  });
});

describe('the four intervals', () => {
  it('advances one interval per correct answer and stops at the last', () => {
    let record = introduce(initialRecord('ctr'), START);
    const seen: number[] = [];

    for (let index = 0; index < 6; index += 1) {
      record = applyAttempt(record, {
        type: 'forward_compute',
        correct: true,
        now: at(index),
      }).record;
      seen.push(
        Math.round((Date.parse(record.nextReviewAt as string) - at(index).getTime()) / DAY),
      );
    }

    expect(seen).toEqual([4, 12, 35, 35, 35, 35]);
  });

  it('reads as due once its date has passed, without anything having to run', () => {
    const record = applyAttempt(introduce(initialRecord('ctr'), START), {
      type: 'forward_compute',
      correct: true,
      now: START,
    }).record;

    expect(stateAt(record, at(1))).toBe('practising');
    expect(stateAt(record, at(5))).toBe('due_review');
  });

  it('lists what is due, soonest first, and leaves the rest alone', () => {
    const early = applyAttempt(introduce(initialRecord('ctr'), START), {
      type: 'forward_compute',
      correct: true,
      now: START,
    }).record;
    const later = applyAttempt(introduce(initialRecord('aov'), START), {
      type: 'forward_compute',
      correct: true,
      now: at(3),
    }).record;

    const due = dueFor([later, early], at(6));
    expect(due.map((record) => record.formulaId)).toEqual(['ctr']);
    expect(dueFor([later, early], at(9)).map((record) => record.formulaId)).toEqual(['ctr', 'aov']);
  });

  it('leaves an unseen formula out of the due list entirely', () => {
    expect(dueFor([initialRecord('ctr')], at(100))).toHaveLength(0);
  });
});

describe('the experience ledger', () => {
  const record = initialRecord('ctr');
  const relation = RELATIONS.get('ctr') as Relation;

  it('pays the first solve more than the repeats, as the formula declares', () => {
    const first = experienceFor(record, { type: 'forward_compute', correct: true });
    const repeat = experienceFor(
      { ...record, solvedBefore: true },
      {
        type: 'forward_compute',
        correct: true,
      },
    );

    expect(first).toBe(relation.gamification.xpFirstSolve);
    expect(repeat).toBe(relation.gamification.xpRepeat);
    expect(first).toBeGreaterThan(repeat);
  });

  it('weights a harder kind of question more heavily', () => {
    const forward = experienceFor(record, { type: 'forward_compute', correct: true });
    const chain = experienceFor(record, { type: 'chain_derivation', correct: true });
    expect(chain).toBeGreaterThan(forward);
  });

  it('adds the bonus for naming the band, and the bonus for finding a planted error', () => {
    const plain = experienceFor(record, { type: 'forward_compute', correct: true });
    const withBand = experienceFor(record, {
      type: 'forward_compute',
      correct: true,
      bandChosen: true,
    });
    expect(withBand).toBe(Math.round(plain * 1.4));

    const spot = experienceFor(record, { type: 'spot_the_error', correct: true });
    // The 1.6 weight of the type, and the 60 percent bonus the rules name for finding the error.
    expect(spot).toBe(Math.round(relation.gamification.xpFirstSolve * 1.6 * 1.6));
  });

  it('scales with partial credit, so half an audit is not a whole one', () => {
    const whole = experienceFor(record, { type: 'audit_the_dashboard', correct: true, credit: 1 });
    const part = experienceFor(record, { type: 'audit_the_dashboard', correct: true, credit: 0.4 });
    expect(part).toBe(Math.round(whole * 0.4));
  });

  it('pays nothing at all for a wrong answer, whatever the bonuses would have been', () => {
    expect(
      experienceFor(record, { type: 'spot_the_error', correct: false, bandChosen: true }),
    ).toBe(0);
  });

  it('adds every award to the running total on the record', () => {
    const outcome = applyAttempt(record, { type: 'forward_compute', correct: true, now: START });
    expect(outcome.record.xp).toBe(outcome.xpAwarded);

    const second = applyAttempt(outcome.record, {
      type: 'inverse_solve',
      correct: true,
      now: at(1),
    });
    expect(second.record.xp).toBe(outcome.xpAwarded + second.xpAwarded);
  });
});

describe('choosing what to ask next', () => {
  it('prefers a kind of question the learner has not answered in this streak', () => {
    const record = run(introduce(initialRecord('ctr'), START), ['forward_compute'], 2);
    const next = nextTypeFor(record, ['forward_compute', 'spot_the_error']);
    expect(next).toBe('spot_the_error');
  });

  it('weights the inverse heavily, because that is the type that builds fluency', () => {
    const record = introduce(initialRecord('ctr'), START);
    expect(nextTypeFor(record, ['forward_compute', 'inverse_solve', 'spot_the_error'])).toBe(
      'inverse_solve',
    );
  });

  it('falls back to what is available once every kind has been seen', () => {
    const record = run(
      introduce(initialRecord('ctr'), START),
      ['forward_compute', 'spot_the_error'],
      2,
    );
    // Nothing new is left to offer, so it returns the first of what there is rather than nothing.
    expect(nextTypeFor(record, ['forward_compute', 'spot_the_error'])).toBe('forward_compute');
  });

  it('says nothing when there is nothing to ask', () => {
    expect(nextTypeFor(initialRecord('ctr'), [])).toBeNull();
  });
});
