import { describe, expect, it } from 'vitest';
import { DecodeState, EncodeState, MaxCustomIdLength, type RollState } from '../src/state.ts';
import { dice } from './test-helpers.ts';

const state: RollState = {
  userId: '123456789012345678',
  shade: 'G',
  ob: 3,
  pool: 5,
  open: true,
  fate: false,
  deeds: true,
  callon: false,
  dice: [{ value: 6, exploded: true }, ...dice(6, 3, 2, 1)],
};

describe('custom_id state', () => {
  it('uses the documented format', () => {
    expect(EncodeState('fate', state)).toBe('fate:123456789012345678:G:3:5:5:x6321');
  });

  it('round-trips', () => {
    for (const action of ['fate', 'deeds', 'callon'] as const) {
      expect(DecodeState(EncodeState(action, state))).toEqual({ action, state });
    }
  });

  it('rejects malformed ids', () => {
    for (const id of ['', 'nope', 'fate:1:Q:3:5:1:6', 'fate:1:G:3:5:1:', 'fate:1:G:3:5:1:7']) {
      expect(DecodeState(id)).toBeNull();
    }
  });

  it('fits a full pool with room for explosions', () => {
    const id = EncodeState('callon', {
      ...state,
      userId: '12345678901234567890',
      ob: 30,
      pool: 30,
      dice: dice(...Array<number>(60).fill(6)),
    });
    expect(id.length).toBeLessThanOrEqual(MaxCustomIdLength);
  });
});
