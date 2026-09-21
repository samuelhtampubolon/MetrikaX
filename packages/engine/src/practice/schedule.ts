/**
 * P18: the mastery state machine, the review scheduler and the experience ledger.
 *
 * Three rules from gamification shape every line here.
 *
 * A wrong answer never subtracts experience. What it costs is the streak, which the specification
 * calls consequence enough, and it is: a learner who is punished twice for one mistake stops
 * answering honestly and starts answering safely.
 *
 * Mastery is not a count of correct answers. It is a count of consecutive correct answers across
 * at least three distinct kinds of question, because answering the same kind of question four
 * times proves only that the shape is familiar.
 *
 * The scheduler is four fixed intervals rather than a full SM-2 with per-item ease factors. The
 * specification gives the reason and it is the right one: a learner can predict four intervals,
 * and cannot predict an ease factor.
 */

import { RELATIONS } from '../formulas/generated/index.ts';
import { XP_MULTIPLIERS, type ItemType } from './items.ts';

export type MasteryState = 'unseen' | 'introduced' | 'practising' | 'mastered' | 'due_review';

/** gamification.mastery_model.review_scheduler.intervals_days. */
export const INTERVALS_DAYS: readonly number[] = Object.freeze([1, 4, 12, 35]);

/** How many distinct challenge types a formula must be answered through to count as mastered. */
export const DISTINCT_TYPES_FOR_MASTERY = 3;

const DAY_MS = 86_400_000;

export interface ProgressRecord {
  readonly formulaId: string;
  readonly state: MasteryState;
  /** Consecutive correct answers. A wrong answer returns it to zero. */
  readonly streak: number;
  /** The kinds of question answered correctly in the current streak. */
  readonly typesInStreak: readonly ItemType[];
  /** Index into INTERVALS_DAYS. */
  readonly intervalIndex: number;
  /** When this formula is next due, as an ISO timestamp, or null while it is unseen. */
  readonly nextReviewAt: string | null;
  readonly attempts: number;
  readonly correct: number;
  readonly xp: number;
  /** True once the formula has been answered correctly at least once. */
  readonly solvedBefore: boolean;
}

export function initialRecord(formulaId: string): ProgressRecord {
  return {
    formulaId,
    state: 'unseen',
    streak: 0,
    typesInStreak: [],
    intervalIndex: 0,
    nextReviewAt: null,
    attempts: 0,
    correct: 0,
    xp: 0,
    solvedBefore: false,
  };
}

export interface AttemptInput {
  readonly type: ItemType;
  readonly correct: boolean;
  /** Between 0 and 1, from the grading rule of the challenge type. */
  readonly credit?: number;
  /** True when the learner also picked the right interpretation band, which earns the bonus. */
  readonly bandChosen?: boolean;
  readonly now?: Date;
}

export interface AttemptOutcome {
  readonly record: ProgressRecord;
  /** The experience this attempt earned. Never negative, and zero for a wrong answer. */
  readonly xpAwarded: number;
  /** True when this attempt is the one that moved the formula to mastered. */
  readonly promoted: boolean;
}

/**
 * Record one attempt.
 *
 * The record returned is a new object: the caller's copy is never modified, so a progress list can
 * be kept in a store that compares by reference.
 */
export function applyAttempt(record: ProgressRecord, attempt: AttemptInput): AttemptOutcome {
  const now = attempt.now ?? new Date();
  const relation = RELATIONS.get(record.formulaId);
  const threshold = relation?.gamification.masteryThreshold ?? 4;

  if (!attempt.correct) {
    // on_incorrect: return to interval index 0 and set state to practising.
    return {
      record: {
        ...record,
        state: 'practising',
        streak: 0,
        typesInStreak: [],
        intervalIndex: 0,
        nextReviewAt: addDays(now, INTERVALS_DAYS[0] as number),
        attempts: record.attempts + 1,
      },
      xpAwarded: 0,
      promoted: false,
    };
  }

  const typesInStreak = record.typesInStreak.includes(attempt.type)
    ? record.typesInStreak
    : [...record.typesInStreak, attempt.type];

  const streak = record.streak + 1;
  const mastered = streak >= threshold && typesInStreak.length >= DISTINCT_TYPES_FOR_MASTERY;

  // on_correct: advance one interval, cap at the last one.
  const intervalIndex = Math.min(record.intervalIndex + 1, INTERVALS_DAYS.length - 1);
  const xpAwarded = experienceFor(record, attempt);

  return {
    record: {
      ...record,
      state: mastered ? 'mastered' : 'practising',
      streak,
      typesInStreak,
      intervalIndex,
      nextReviewAt: addDays(now, INTERVALS_DAYS[intervalIndex] as number),
      attempts: record.attempts + 1,
      correct: record.correct + 1,
      xp: record.xp + xpAwarded,
      solvedBefore: true,
    },
    xpAwarded,
    promoted: mastered && record.state !== 'mastered',
  };
}

/**
 * The experience one correct answer is worth.
 *
 * xp_rules: the award for a first solve or for a repeat, multiplied by the weight of the challenge
 * type, plus the two bonuses the specification names. There is no time bonus anywhere, because
 * speed is not the skill being taught.
 */
export function experienceFor(record: ProgressRecord, attempt: AttemptInput): number {
  if (!attempt.correct) return 0;

  const relation = RELATIONS.get(record.formulaId);
  const base = record.solvedBefore
    ? (relation?.gamification.xpRepeat ?? 2)
    : (relation?.gamification.xpFirstSolve ?? 10);

  let bonus = 1;
  if (attempt.bandChosen === true) bonus += 0.4;
  if (attempt.type === 'spot_the_error') bonus += 0.6;

  const credit = attempt.credit ?? 1;
  return Math.round(base * XP_MULTIPLIERS[attempt.type] * bonus * credit);
}

/** Mark a formula as seen, without recording an answer. */
export function introduce(record: ProgressRecord, now = new Date()): ProgressRecord {
  if (record.state !== 'unseen') return record;
  return {
    ...record,
    state: 'introduced',
    nextReviewAt: addDays(now, INTERVALS_DAYS[0] as number),
  };
}

/**
 * The state as of a moment, which is not always the state that was stored.
 *
 * A formula whose review date has passed is due, whatever it was when it was put away. The stored
 * state is left alone and the reading is derived, so nothing has to run on a timer for the
 * progress list to be right.
 */
export function stateAt(record: ProgressRecord, now = new Date()): MasteryState {
  if (record.state === 'unseen') return 'unseen';
  if (record.nextReviewAt === null) return record.state;
  return Date.parse(record.nextReviewAt) <= now.getTime() ? 'due_review' : record.state;
}

/** The formulas due for review, soonest first. The Review due today entry point reads this. */
export function dueFor(records: readonly ProgressRecord[], now = new Date()): ProgressRecord[] {
  return records
    .filter((record) => stateAt(record, now) === 'due_review')
    .sort((left, right) => (left.nextReviewAt ?? '').localeCompare(right.nextReviewAt ?? ''));
}

/**
 * Which kind of question to ask next about this formula.
 *
 * Mastery needs three distinct kinds, so a kind already answered in this streak is the last one
 * offered. The specification also asks that inverse_solve be weighted heavily, since it is the
 * type that builds fluency, so it goes first among the kinds not yet seen.
 */
export function nextTypeFor(
  record: ProgressRecord,
  available: readonly ItemType[],
): ItemType | null {
  if (available.length === 0) return null;

  const unseen = available.filter((type) => !record.typesInStreak.includes(type));
  const pool = unseen.length > 0 ? unseen : available;

  const preferred = pool.find((type) => type === 'inverse_solve');
  return preferred ?? (pool[0] as ItemType);
}

function addDays(from: Date, days: number): string {
  return new Date(from.getTime() + days * DAY_MS).toISOString();
}
