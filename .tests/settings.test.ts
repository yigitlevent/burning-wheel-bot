import { describe, expect, it } from 'vitest';
import { DeleteSettings, LoadSettings, ParseDiceEmojis, SaveSettings, type SettingsStore } from '../src/settings.ts';
import { memoryStore } from './test-helpers.ts';

const UNICODE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const KEYCAPS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
const CUSTOM = [1, 2, 3, 4, 5, 6].map((face) => `<:d${face}:1000000000000000${face}>`);

describe('parseDiceEmojis', () => {
  it('accepts custom emojis, keeping their order', () => {
    expect(ParseDiceEmojis(CUSTOM.join(' '))).toEqual(CUSTOM);
  });

  it('accepts animated custom emojis', () => {
    const animated = CUSTOM.map((emoji) => emoji.replace('<:', '<a:'));
    expect(ParseDiceEmojis(animated.join(' '))).toEqual(animated);
  });

  it('accepts unicode emojis with spaces, commas or nothing between them', () => {
    expect(ParseDiceEmojis(KEYCAPS.join(' '))).toEqual(KEYCAPS);
    expect(ParseDiceEmojis(KEYCAPS.join(', '))).toEqual(KEYCAPS);
    expect(ParseDiceEmojis(KEYCAPS.join(''))).toEqual(KEYCAPS);
  });

  it('rejects the wrong number of emojis', () => {
    expect(ParseDiceEmojis(KEYCAPS.slice(1).join(' '))).toBeNull();
    expect(ParseDiceEmojis([...KEYCAPS, '1️⃣'].join(' '))).toBeNull();
  });

  it('rejects anything that is not an emoji', () => {
    expect(ParseDiceEmojis('1 2 3 4 5 6')).toBeNull();
    expect(ParseDiceEmojis(`${KEYCAPS.join(' ')} @everyone`)).toBeNull();
    expect(ParseDiceEmojis(UNICODE.join(' '))).toBeNull();
  });
});

describe('settings store', () => {
  it('uses no settings outside a server', async () => {
    expect(await LoadSettings(memoryStore())).toEqual({});
  });

  it('keeps servers separate', async () => {
    const store = memoryStore();
    await SaveSettings(store, '1', { diceEmojis: KEYCAPS });
    expect(await LoadSettings(store, '1')).toEqual({ diceEmojis: KEYCAPS });
    expect(await LoadSettings(store, '2')).toEqual({});
  });

  it('forgets deleted settings', async () => {
    const store = memoryStore();
    await SaveSettings(store, '1', { diceEmojis: KEYCAPS });
    await DeleteSettings(store, '1');
    expect(await LoadSettings(store, '1')).toEqual({});
  });

  it('falls back to no settings when the store fails', async () => {
    const store = { get: () => Promise.reject(new Error('down')) } as unknown as SettingsStore;
    expect(await LoadSettings(store, '1')).toEqual({});
  });

  it('falls back to no settings on unreadable data', async () => {
    const store = memoryStore();
    store.values.set('guild:1', 'not json');
    expect(await LoadSettings(store, '1')).toEqual({});
  });
});
