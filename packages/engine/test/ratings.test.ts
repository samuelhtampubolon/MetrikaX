/**
 * P19 tests for the rating ladder and the badges.
 *
 * The definition of done is that ratings unlock modules correctly and that each badge condition
 * fires exactly once. The ladder is compared with the specification file itself, so a number
 * copied wrongly, or changed later in the specification, fails here.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FORMULA_BADGES,
  NOT_EVALUABLE,
  NO_COUNTERS,
  RATINGS,
  RELATION_LIST,
  applyAttempt,
  certificateEarned,
  initialRecord,
  introduce,
  modulesUnlockedAt,
  newBadges,
  ratingFor,
  xpToNext,
  type ItemType,
  type ProgressRecord,
} from '../src/index.ts';

const spec = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../../spec/metrika.spec.json'), 'utf8'),
) as {
  gamification: {
    rating_ladder: {
      level: number;
      code: string;
      name_id: string;
      name_en: string;
      xp_required: number;
    }[];
    badges: { structural_badges: { id: string }[] };
  };
};

const TYPES: ItemType[] = ['forward_compute', 'inverse_solve', 'spot_the_error'];

function mastered(formulaId: string): ProgressRecord {
  let record = introduce(initialRecord(formulaId));
  for (let index = 0; index < 8; index += 1) {
    record = applyAttempt(record, { type: TYPES[index % 3] as ItemType, correct: true }).record;
  }
  expect(record.state, formulaId).toBe('mastered');
  return record;
}

describe('the ladder agrees with the specification', () => {
  it('carries the same nine ratings, codes, names and thresholds', () => {
    const declared = spec.gamification.rating_ladder;
    expect(RATINGS).toHaveLength(declared.length);
    RATINGS.forEach((rating, index) => {
      const entry = declared[index];
      expect(rating.level).toBe(entry?.level);
      expect(rating.code).toBe(entry?.code);
      expect(rating.nameId).toBe(entry?.name_id);
      expect(rating.nameEn).toBe(entry?.name_en);
      expect(rating.xpRequired).toBe(entry?.xp_required);
    });
  });
});

describe('ratings', () => {
  it('starts everyone at the first rating', () => {
    expect(ratingFor(0).code).toBe('T1');
  });

  it('moves up exactly at each threshold and not one point before', () => {
    for (const rating of RATINGS) {
      expect(ratingFor(rating.xpRequired).code).toBe(rating.code);
      if (rating.xpRequired > 0)
        expect(ratingFor(rating.xpRequired - 1).level).toBe(rating.level - 1);
    }
  });

  it('never goes down as experience grows, since experience never decays', () => {
    let previous = 0;
    for (let xp = 0; xp <= 13_000; xp += 50) {
      const level = ratingFor(xp).level;
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });

  it('says how far the next rating is, and nothing at the top', () => {
    expect(xpToNext(0)).toBe(250);
    expect(xpToNext(249)).toBe(1);
    expect(xpToNext(12_000)).toBeNull();
  });
});

describe('what a rating unlocks', () => {
  it('opens modules 1 and 2 at the start, and module 3 only from the second rating', () => {
    expect(modulesUnlockedAt(1)).toEqual([1, 2]);
    expect(modulesUnlockedAt(2)).toEqual([1, 2, 3]);
  });

  it('opens all nine modules by the seventh rating', () => {
    expect(modulesUnlockedAt(7).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('issues a certificate from the third rating and not before', () => {
    expect(certificateEarned(599)).toBe(false);
    expect(certificateEarned(600)).toBe(true);
  });
});

describe('badges', () => {
  it('has one badge for every formula, each with its own id', () => {
    expect(FORMULA_BADGES).toHaveLength(76);
    expect(new Set(FORMULA_BADGES.map((badge) => badge.id)).size).toBe(76);
  });

  it('awards a formula badge when the formula is mastered, and not before', () => {
    expect(newBadges([introduce(initialRecord('ctr'))], new Set())).toEqual([]);
    expect(newBadges([mastered('ctr')], new Set())).toEqual(['badge_ctr']);
  });

  it('fires exactly once: a second call with the award held returns nothing', () => {
    const records = [mastered('ctr')];
    const first = newBadges(records, new Set());
    expect(first).toEqual(['badge_ctr']);
    expect(newBadges(records, new Set(first))).toEqual([]);
  });

  it('keeps a badge once earned, even after a wrong answer takes the streak away', () => {
    const lapsed = applyAttempt(mastered('ctr'), {
      type: 'forward_compute',
      correct: false,
    }).record;
    expect(lapsed.state).toBe('practising');
    expect(newBadges([lapsed], new Set(['badge_ctr']))).toEqual([]);
  });

  it('awards the stratum badge only when every formula of the stratum is held', () => {
    const stratum = RELATION_LIST.filter((relation) => relation.taxonomy.stratum === 'V');
    expect(stratum).toHaveLength(10);

    const ids = stratum.map((relation) => relation.gamification.badgeId);
    const almost = new Set(ids.slice(1));
    expect(newBadges([], almost)).not.toContain('badge_stratum_V');

    const all = new Set(ids);
    expect(newBadges([], all)).toContain('badge_stratum_V');
  });

  it('awards the counter badges from their counters and no sooner', () => {
    expect(newBadges([], new Set(), { ...NO_COUNTERS, auditsPerfect: 2 })).not.toContain(
      'badge_auditor',
    );
    expect(newBadges([], new Set(), { ...NO_COUNTERS, auditsPerfect: 3 })).toContain(
      'badge_auditor',
    );
    expect(newBadges([], new Set(), { ...NO_COUNTERS, dominantFactorsNamed: 10 })).toContain(
      'badge_axis_c4',
    );
  });

  it('needs both halves of the C7 badge: the class mastered and five interpretations', () => {
    const ids = RELATION_LIST.filter((relation) => relation.taxonomy.structuralClass === 'C7').map(
      (relation) => relation.gamification.badgeId,
    );
    expect(ids).toHaveLength(3);

    const held = new Set(ids);
    expect(newBadges([], held, { ...NO_COUNTERS, evpiInterpretations: 4 })).not.toContain(
      'badge_axis_c7',
    );
    expect(
      newBadges([], new Set(ids.slice(1)), { ...NO_COUNTERS, evpiInterpretations: 9 }),
    ).not.toContain('badge_axis_c7');
    expect(newBadges([], held, { ...NO_COUNTERS, evpiInterpretations: 5 })).toContain(
      'badge_axis_c7',
    );
  });

  it('cannot award the chain badge at depth three, the deepest this corpus supports', () => {
    expect(newBadges([], new Set(), { ...NO_COUNTERS, deepestChain: 3 })).not.toContain(
      'badge_full_chain',
    );
  });

  it('names every structural badge it cannot yet evaluate, and awards none of them', () => {
    const declared = spec.gamification.badges.structural_badges.map((badge) => badge.id);
    const handled = new Set([
      'badge_stratum_I',
      'badge_stratum_V',
      'badge_axis_c4',
      'badge_axis_c7',
      'badge_full_chain',
      'badge_auditor',
      ...Object.keys(NOT_EVALUABLE),
    ]);
    // Every badge the specification declares is either evaluated or named as not evaluable, so
    // none is silently missing.
    expect(declared.filter((id) => !handled.has(id))).toEqual([]);

    const everything = newBadges([], new Set(), {
      auditsPerfect: 99,
      deepestChain: 99,
      evpiInterpretations: 99,
      dominantFactorsNamed: 99,
    });
    for (const id of Object.keys(NOT_EVALUABLE)) expect(everything).not.toContain(id);
  });
});
