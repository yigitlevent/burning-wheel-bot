import { describe, expect, it } from 'vitest';
import {
  CountSuccesses,
  Explode,
  FailedIndexes,
  RerollFailures,
  RerollOne,
  RollPool,
  SecureRng,
  Threshold,
} from '../src/dice.ts';
import { dice, queuedRng } from './test-helpers.ts';

describe('shades', () => {
  it('uses 4+, 3+ and 2+', () => {
    expect([Threshold('B'), Threshold('G'), Threshold('W')]).toEqual([4, 3, 2]);
  });

  it('counts successes by shade', () => {
    const pool = dice(6, 4, 3, 2, 1);
    expect(CountSuccesses(pool, 'B')).toBe(2);
    expect(CountSuccesses(pool, 'G')).toBe(3);
    expect(CountSuccesses(pool, 'W')).toBe(4);
  });

  it('finds failures by shade', () => {
    expect(FailedIndexes(dice(6, 3, 1), 'B')).toEqual([1, 2]);
    expect(FailedIndexes(dice(6, 3, 1), 'W')).toEqual([2]);
  });
});

describe('explode', () => {
  it('follows chains of 6s', () => {
    expect(Explode(dice(6, 2), queuedRng(6, 6, 1))).toEqual([
      { value: 6, exploded: true },
      { value: 2, exploded: false },
      { value: 6, exploded: true },
      { value: 6, exploded: true },
      { value: 1, exploded: false },
    ]);
  });

  it('leaves already exploded 6s alone', () => {
    const pool = [{ value: 6, exploded: true }];
    expect(Explode(pool, queuedRng())).toEqual(pool);
  });

  it('does not change its input', () => {
    const pool = dice(6);
    Explode(pool, queuedRng(1));
    expect(pool).toEqual(dice(6));
  });
});

describe('rollPool', () => {
  it('leaves 6s alone when not open', () => {
    expect(RollPool(2, false, queuedRng(6, 1))).toEqual(dice(6, 1));
  });

  it('explodes 6s when open', () => {
    expect(RollPool(2, true, queuedRng(6, 1, 3))).toHaveLength(3);
  });
});

describe('rerolls', () => {
  it('rerolls every failure', () => {
    expect(RerollFailures(dice(6, 3, 1), 'B', false, queuedRng(4, 5))).toEqual(dice(6, 4, 5));
  });

  it('rerolls only the first failure', () => {
    expect(RerollOne(dice(6, 3, 1), 'B', false, queuedRng(5))).toEqual(dice(6, 5, 1));
  });

  it('does nothing with no failures', () => {
    expect(RerollOne(dice(6, 5), 'B', false, queuedRng())).toEqual(dice(6, 5));
  });

  it('explodes rerolled 6s only when exploding', () => {
    expect(RerollOne(dice(1), 'B', false, queuedRng(6))).toEqual(dice(6));
    expect(RerollOne(dice(1), 'B', true, queuedRng(6, 2))).toEqual([
      { value: 6, exploded: true },
      { value: 2, exploded: false },
    ]);
  });
});

describe('secureRng', () => {
  it('stays within 1..6 and reaches every face', () => {
    const rolls = Array.from({ length: 1000 }, SecureRng);
    expect([...new Set(rolls)].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
