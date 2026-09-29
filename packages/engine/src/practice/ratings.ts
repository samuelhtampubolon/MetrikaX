/**
 * P19: the nine-rating ladder and the badges.
 *
 * Both are pure functions of a progress record and a handful of counters. Neither stores anything:
 * a rating is read from the experience total each time it is asked for, and a badge is a fact that
 * is either already in the set of awards or is newly true. That is what lets "fires exactly once"
 * be a property of the function rather than of the code that calls it.
 */

import { RELATION_LIST } from '../formulas/generated/index.ts';
import type { ProgressRecord } from './schedule.ts';

export interface Rating {
  readonly level: number;
  readonly code: string;
  readonly nameId: string;
  readonly nameEn: string;
  readonly xpRequired: number;
  /** The modules that open at this rating, from gamification.rating_ladder.unlocks. */
  readonly unlocksModules: readonly number[];
}

/**
 * gamification.rating_ladder. A test compares every number here with the specification file, so a
 * change to the ladder there fails here rather than drifting.
 */
export const RATINGS: readonly Rating[] = Object.freeze([
  {
    level: 1,
    code: 'T1',
    nameId: 'Pengamat',
    nameEn: 'Observer',
    xpRequired: 0,
    unlocksModules: [1, 2],
  },
  {
    level: 2,
    code: 'T2',
    nameId: 'Pencatat',
    nameEn: 'Recorder',
    xpRequired: 250,
    unlocksModules: [3],
  },
  {
    level: 3,
    code: 'T3',
    nameId: 'Juru Hitung',
    nameEn: 'Calculator',
    xpRequired: 600,
    unlocksModules: [4],
  },
  {
    level: 4,
    code: 'T4',
    nameId: 'Penganalisis',
    nameEn: 'Analyst',
    xpRequired: 1200,
    unlocksModules: [5, 6],
  },
  {
    level: 5,
    code: 'T5',
    nameId: 'Penilai',
    nameEn: 'Appraiser',
    xpRequired: 2200,
    unlocksModules: [7],
  },
  {
    level: 6,
    code: 'T6',
    nameId: 'Perencana',
    nameEn: 'Planner',
    xpRequired: 3600,
    unlocksModules: [8],
  },
  {
    level: 7,
    code: 'T7',
    nameId: 'Perancang Riset',
    nameEn: 'Research Designer',
    xpRequired: 5400,
    unlocksModules: [9],
  },
  {
    level: 8,
    code: 'T8',
    nameId: 'Pengambil Keputusan',
    nameEn: 'Decision Maker',
    xpRequired: 8000,
    unlocksModules: [],
  },
  {
    level: 9,
    code: 'T9',
    nameId: 'Auditor Metrik',
    nameEn: 'Metrics Auditor',
    xpRequired: 12000,
    unlocksModules: [],
  },
]);

/** The rating a given experience total has reached. Experience never decays, so neither does this. */
export function ratingFor(totalXp: number): Rating {
  let reached = RATINGS[0] as Rating;
  for (const rating of RATINGS) {
    if (totalXp >= rating.xpRequired) reached = rating;
  }
  return reached;
}

/** How much more experience the next rating needs, or null at the top of the ladder. */
export function xpToNext(totalXp: number): number | null {
  const next = RATINGS.find((rating) => rating.xpRequired > totalXp);
  return next === undefined ? null : next.xpRequired - totalXp;
}

/** Every module open at a rating, which is the union of everything up to and including it. */
export function modulesUnlockedAt(level: number): number[] {
  return RATINGS.filter((rating) => rating.level <= level).flatMap((rating) => [
    ...rating.unlocksModules,
  ]);
}

/** The rating from which a certificate is issued, from gamification.certificate.trigger. */
export const CERTIFICATE_FROM_LEVEL = 3;

export function certificateEarned(totalXp: number): boolean {
  return ratingFor(totalXp).level >= CERTIFICATE_FROM_LEVEL;
}

/* ------------------------------------------------------------------ *
 * Badges
 * ------------------------------------------------------------------ */

/**
 * Counters the progress records cannot supply on their own.
 *
 * Each counts something the specification names in a badge condition. The ones that need an event
 * nobody records yet, such as a denominator error, are absent on purpose: a badge cannot honestly
 * be awarded for a fact the application does not measure.
 */
export interface Counters {
  /** audit_the_dashboard items completed with both errors found. */
  readonly auditsPerfect: number;
  /** The deepest chain_derivation completed. */
  readonly deepestChain: number;
  /** Correct answers to interpret_the_band on the EVPI formula. */
  readonly evpiInterpretations: number;
  /** Sensitivity analyses in which the learner named the dominant factor correctly. */
  readonly dominantFactorsNamed: number;
}

export const NO_COUNTERS: Counters = Object.freeze({
  auditsPerfect: 0,
  deepestChain: 0,
  evpiInterpretations: 0,
  dominantFactorsNamed: 0,
});

export interface BadgeDefinition {
  readonly id: string;
  /** Formula badges name their formula; structural ones name none. */
  readonly formulaId: string | null;
}

/** One badge per formula, from the id each formula declares. */
export const FORMULA_BADGES: readonly BadgeDefinition[] = Object.freeze(
  RELATION_LIST.map((relation) => ({
    id: relation.gamification.badgeId,
    formulaId: relation.formulaId,
  })),
);

const IDS_BY_STRATUM = (stratum: string): string[] =>
  RELATION_LIST.filter((relation) => relation.taxonomy.stratum === stratum).map(
    (relation) => relation.gamification.badgeId,
  );

const IDS_BY_CLASS = (code: string): string[] =>
  RELATION_LIST.filter((relation) => relation.taxonomy.structuralClass === code).map(
    (relation) => relation.gamification.badgeId,
  );

/**
 * The structural badges this application can evaluate, and the reason for each one it cannot.
 *
 * badge_axis_c1 asks for a class mastered without a single denominator error, which needs every
 * wrong answer classified by cause. badge_no_confusion needs the confusable pairs drill, and
 * badge_offline needs the module content. None of the three exists yet, so none is awarded.
 * badge_full_chain asks for a chain of depth five, and the deepest this corpus supports is three,
 * so it is evaluated honestly and simply cannot fire. See DEVIATIONS.md, D-26 and D-27.
 */
export const NOT_EVALUABLE: Readonly<Record<string, string>> = Object.freeze({
  badge_axis_c1: 'needs every wrong answer classified by cause',
  badge_no_confusion: 'needs the confusable pairs drill',
  badge_offline: 'needs the module content',
});

/**
 * The badges that became true and were not already held.
 *
 * `held` is everything awarded so far. What is returned is only the difference, so calling this
 * after every attempt awards each badge once: a second call with the result merged into `held`
 * returns nothing.
 */
export function newBadges(
  records: readonly ProgressRecord[],
  held: ReadonlySet<string>,
  counters: Counters = NO_COUNTERS,
): string[] {
  const mastered = new Set<string>(held);
  for (const record of records) {
    if (record.state !== 'mastered') continue;
    const relation = RELATION_LIST.find((entry) => entry.formulaId === record.formulaId);
    if (relation !== undefined) mastered.add(relation.gamification.badgeId);
  }

  const earned = new Set<string>();
  const award = (id: string, condition: boolean): void => {
    if (condition && !held.has(id)) earned.add(id);
  };

  for (const badge of FORMULA_BADGES) award(badge.id, mastered.has(badge.id));

  const all = (ids: readonly string[]): boolean =>
    ids.length > 0 && ids.every((id) => mastered.has(id));

  award('badge_stratum_I', all(IDS_BY_STRATUM('I')));
  award('badge_stratum_V', all(IDS_BY_STRATUM('V')));
  award('badge_axis_c4', counters.dominantFactorsNamed >= 10);
  award('badge_axis_c7', all(IDS_BY_CLASS('C7')) && counters.evpiInterpretations >= 5);
  award('badge_full_chain', counters.deepestChain >= 5);
  award('badge_auditor', counters.auditsPerfect >= 3);

  return [...earned].sort();
}
