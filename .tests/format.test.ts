import { describe, expect, it } from 'vitest';
import { Buttons, ResultLine } from '../src/format.ts';
import type { RollState } from '../src/state.ts';
import { dice, plain } from './test-helpers.ts';

const state: RollState = {
  userId: '1',
  shade: 'G',
  ob: 3,
  disadvantage: 0,
  pool: 5,
  open: false,
  beginner: false,
  fate: false,
  deeds: false,
  callon: false,
  dice: dice(6, 4, 3, 2, 1),
};

function row(rollState: RollState) {
  return Buttons(rollState)[0]?.components ?? [];
}

describe('resultLine', () => {
  it('reports a pass with its margin', () => {
    expect(plain(ResultLine(state))).toBe('✔ PASS (+0) (Routine test)\n5D Grey vs Ob 3 → [6, 4, 3, 2, 1] = 3 successes');
  });

  it('reports a fail with its margin', () => {
    expect(ResultLine({ ...state, ob: 5 })).toContain('✖ FAIL (-2)');
  });

  it('just reports successes at Ob 0', () => {
    expect(plain(ResultLine({ ...state, ob: 0 }))).toBe('5D Grey → [6, 4, 3, 2, 1] = 3 successes');
  });

  it('marks open rolls and exploded dice', () => {
    const line = plain(ResultLine({ ...state, open: true, dice: [{ value: 6, exploded: true }, ...dice(1)] }));
    expect(line).toContain('5D Grey open-ended');
    expect(line).toContain('[6!, 1] = 1 success');
  });
});

describe("Beginner's Luck", () => {
  const beginner = { ...state, beginner: true };

  it('doubles the Ob and counts a routine base Ob toward the skill', () => {
    expect(plain(ResultLine(beginner))).toBe(
      "✖ FAIL (-3) (Routine test, counts toward learning the skill)\n5D Grey Beginner's Luck vs Ob 6 → [6, 4, 3, 2, 1] = 3 successes",
    );
  });

  it('counts a difficult or challenging base Ob toward the root stat', () => {
    expect(ResultLine({ ...beginner, ob: 4 })).toContain('(Difficult test, counts toward the root stat)');
    expect(ResultLine({ ...beginner, ob: 6 })).toContain('(Challenging test, counts toward the root stat)');
  });

  it('adds disadvantages to the base Ob but does not double them', () => {
    const line = ResultLine({ ...beginner, disadvantage: 1 });
    expect(line).toContain('vs Ob 7');
    expect(line).toContain('(Difficult test, counts toward the root stat)');
  });

  it('leaves Ob 1 on one die to the player', () => {
    const line = ResultLine({ ...beginner, pool: 1, ob: 1, dice: dice(4) });
    expect(line).toContain('(Routine or Difficult test, counts toward the skill or the root stat)');
  });

  it('has no note past the advancement table', () => {
    expect(ResultLine({ ...beginner, pool: 19 })).not.toContain('counts toward');
  });

  it('stays a graduated test at Ob 0', () => {
    expect(plain(ResultLine({ ...beginner, ob: 0 }))).toBe(
      "5D Grey Beginner's Luck → [6, 4, 3, 2, 1] = 3 successes",
    );
  });

  it('adds a disadvantage without doubling on a normal roll', () => {
    expect(ResultLine({ ...state, disadvantage: 2 })).toContain('vs Ob 5');
  });
});

describe('dice order', () => {
  it('shows dice high to low without changing the stored order', () => {
    const rolled = { ...state, dice: dice(2, 6, 1, 4) };
    expect(plain(ResultLine(rolled))).toContain('[6, 4, 2, 1]');
    expect(rolled.dice).toEqual(dice(2, 6, 1, 4));
    expect(Buttons(rolled)[0]?.components[0]?.custom_id).toMatch(/:2614$/);
  });
});

describe('dice faces', () => {
  const emojis = ['<:d1:10000000000000001>', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];

  it('has no code block or colour codes', () => {
    expect(ResultLine(state)).not.toMatch(/```|\u001b/);
  });

  it('bolds successes by shade', () => {
    expect(ResultLine({ ...state, dice: dice(3, 2) })).toContain('[**3**, 2]');
  });

  it('shows the emoji for each face, high to low', () => {
    const line = ResultLine({ ...state, dice: dice(1, 6, 2) }, [], emojis);
    expect(line).toContain('[6️⃣ 2️⃣ <:d1:10000000000000001>]');
  });

  it('marks exploded dice on emojis', () => {
    const line = ResultLine({ ...state, dice: [{ value: 6, exploded: true }] }, [], emojis);
    expect(line).toContain('[6️⃣!]');
  });

  it('falls back to numbers when emojis would pass the message limit', () => {
    const long = Array<string>(6).fill(`<:${'d'.repeat(32)}:10000000000000001>`);
    const line = ResultLine({ ...state, dice: dice(...Array<number>(60).fill(1)) }, [], long);
    expect(line.length).toBeLessThanOrEqual(2000);
    expect(line).toContain('[1, 1,');
  });
});

describe('buttons', () => {
  it('offers all three on a fresh roll', () => {
    expect(row(state).map((button) => button.disabled)).toEqual([false, false, false]);
  });

  it('changes the Fate label on open rolls', () => {
    expect(row(state)[0]?.label).toBe('Fate: explode 6s');
    expect(row({ ...state, open: true })[0]?.label).toBe('Fate: reroll 1 failure');
  });

  it('disables each spent button', () => {
    const spent = row({ ...state, fate: true, deeds: true });
    expect(spent.map((button) => button.disabled)).toEqual([true, true, false]);
  });

  it('disables Fate without unexploded 6s on a closed roll', () => {
    expect(row({ ...state, dice: dice(4, 1) })[0]?.disabled).toBe(true);
  });

  it('disables Fate without failures on an open roll', () => {
    expect(Buttons({ ...state, open: true, dice: dice(5) })).toEqual([]);
  });

  it('disables Deeds and Call-on without failures', () => {
    const disabled = row({ ...state, dice: dice(6, 5) }).map((button) => button.disabled);
    expect(disabled).toEqual([false, true, true]);
  });

  it('removes the row when nothing is left to spend', () => {
    expect(Buttons({ ...state, dice: dice(5, 4) })).toEqual([]);
  });

  it('drops buttons when the state no longer fits a custom_id', () => {
    expect(Buttons({ ...state, dice: dice(...Array<number>(90).fill(1)) })).toEqual([]);
  });
});
