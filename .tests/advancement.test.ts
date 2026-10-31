import { describe, expect, it } from 'vitest';
import { TestDifficulty } from '../src/advancement.ts';

describe('testDifficulty', () => {
  it('matches the book at each band edge', () => {
    const rows: [pool: number, routine: number, difficultFrom: number, difficultTo: number][] = [
      [2, 1, 2, 2],
      [3, 2, 3, 3],
      [4, 2, 3, 4],
      [5, 3, 4, 5],
      [6, 4, 5, 6],
      [7, 4, 5, 7],
      [8, 5, 6, 8],
      [9, 6, 7, 9],
      [10, 7, 8, 10],
      [11, 8, 9, 11],
      [12, 9, 10, 12],
      [13, 10, 11, 13],
      [14, 11, 12, 14],
      [15, 12, 13, 15],
      [16, 13, 14, 16],
      [17, 14, 15, 17],
      [18, 15, 16, 18],
    ];
    for (const [pool, routine, difficultFrom, difficultTo] of rows) {
      expect(TestDifficulty(pool, 1)).toBe('Routine');
      expect(TestDifficulty(pool, routine)).toBe('Routine');
      expect(TestDifficulty(pool, difficultFrom)).toBe('Difficult');
      expect(TestDifficulty(pool, difficultTo)).toBe('Difficult');
      expect(TestDifficulty(pool, difficultTo + 1)).toBe('Challenging');
    }
  });

  it('leaves Ob 1 on one die to the player', () => {
    expect(TestDifficulty(1, 1)).toBe('Routine or Difficult');
    expect(TestDifficulty(1, 2)).toBe('Challenging');
  });

  it('has no label at Ob 0', () => {
    expect(TestDifficulty(5, 0)).toBeNull();
    expect(TestDifficulty(19, 0)).toBeNull();
  });

  it('keeps the pattern past 18D', () => {
    expect(TestDifficulty(30, 27)).toBe('Routine');
    expect(TestDifficulty(30, 28)).toBe('Difficult');
    expect(TestDifficulty(30, 30)).toBe('Difficult');
    expect(TestDifficulty(30, 31)).toBe('Challenging');
  });
});
