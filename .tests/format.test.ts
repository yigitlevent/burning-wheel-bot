import { describe, expect, it } from 'vitest';
import { Buttons, ResultLine } from '../src/format.ts';
import type { RollState } from '../src/state.ts';
import { dice, plain } from './test-helpers.ts';

const state: RollState = {
  userId: '1',
  shade: 'G',
  ob: 3,
  pool: 5,
  open: false,
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

describe('dice order', () => {
  it('shows dice high to low without changing the stored order', () => {
    const rolled = { ...state, dice: dice(2, 6, 1, 4) };
    expect(plain(ResultLine(rolled))).toContain('[6, 4, 2, 1]');
    expect(rolled.dice).toEqual(dice(2, 6, 1, 4));
    expect(Buttons(rolled)[0]?.components[0]?.custom_id).toMatch(/:2614$/);
  });
});

describe('dice colours', () => {
  it('wraps the result in an ansi block', () => {
    expect(ResultLine(state)).toMatch(/^```ansi\n[\s\S]*\n```$/);
  });

  it('colours successes green and failures red by shade', () => {
    const line = ResultLine({ ...state, dice: dice(3, 2) });
    expect(line).toContain('\u001b[32m3\u001b[0m, \u001b[31m2\u001b[0m');
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
