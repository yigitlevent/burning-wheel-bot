import {
  ApplicationCommandOptionType,
  InteractionResponseType,
  MessageFlags,
  type APIChatInputApplicationCommandInteraction,
  type APIInteractionResponse,
  type APIMessageComponentButtonInteraction,
} from 'discord-api-types/v10';
import { describe, expect, it } from 'vitest';
import { HandleButton, HandleRoll, HandleRollSettings } from '../src/handlers.ts';
import { LoadSettings, SaveSettings } from '../src/settings.ts';
import { dice, memoryStore, plain, queuedRng } from './test-helpers.ts';
import { DecodeState, EncodeState, type Action, type RollState } from '../src/state.ts';

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
const ROLLER = '111';
const inGuild = (id: string) => ({ member: { user: { id } } });
const inDm = (id: string) => ({ user: { id } });

function rollInteraction(
  options: { name: string; type: ApplicationCommandOptionType; value: unknown }[],
) {
  return {
    ...inGuild(ROLLER),
    data: { name: 'roll', options },
  } as unknown as APIChatInputApplicationCommandInteraction;
}

function click(
  action: Action,
  state: RollState,
  actor: object = inGuild(ROLLER),
  content = 'old result',
) {
  return {
    ...actor,
    data: { custom_id: EncodeState(action, state) },
    message: { content },
  } as unknown as APIMessageComponentButtonInteraction;
}

function rawContentOf(response: APIInteractionResponse): string {
  return (response as { data: { content: string } }).data.content;
}

function contentOf(response: APIInteractionResponse): string {
  return plain(rawContentOf(response));
}

function customIds(response: APIInteractionResponse): string[] {
  const { components } = (
    response as { data: { components: { components: { custom_id: string }[] }[] } }
  ).data;
  return components.flatMap((row) => row.components.map((button) => button.custom_id));
}

function isEphemeral(response: APIInteractionResponse): boolean {
  return (
    response.type === InteractionResponseType.ChannelMessageWithSource &&
    response.data.flags === MessageFlags.Ephemeral
  );
}

const closed: RollState = {
  userId: ROLLER,
  shade: 'B',
  ob: 2,
  disadvantage: 0,
  pool: 3,
  open: false,
  beginner: false,
  fate: false,
  deeds: false,
  callon: false,
  dice: dice(6, 3, 1),
};

/** A roll whose 6 has already exploded: open from the start, or opened by spending Fate. */
function exploded(open: boolean): RollState {
  return {
    ...closed,
    open,
    fate: !open,
    dice: [{ value: 6, exploded: true }, ...dice(3, 1)],
  };
}

describe('handleRoll', () => {
  it('applies the defaults', () => {
    const response = HandleRoll(
      rollInteraction([{ name: 'dice', type: ApplicationCommandOptionType.Integer, value: 2 }]),
      queuedRng(4, 1),
    );
    expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource);
    expect(contentOf(response)).toBe('2D Black → [4, 1] = 1 success');
  });

  it('reads every option', () => {
    const response = HandleRoll(
      rollInteraction([
        { name: 'dice', type: ApplicationCommandOptionType.Integer, value: 2 },
        { name: 'ob', type: ApplicationCommandOptionType.Integer, value: 2 },
        { name: 'shade', type: ApplicationCommandOptionType.String, value: 'W' },
        { name: 'open', type: ApplicationCommandOptionType.Boolean, value: true },
      ]),
      queuedRng(6, 2, 1),
    );
    expect(contentOf(response)).toBe(
      '✔ PASS (+0) (Difficult test)\n2D White open-ended vs Ob 2 → [6!, 2, 1] = 2 successes',
    );
  });

  it("keeps Beginner's Luck through a spend", () => {
    const roll = HandleRoll(
      rollInteraction([
        { name: 'dice', type: ApplicationCommandOptionType.Integer, value: 2 },
        { name: 'ob', type: ApplicationCommandOptionType.Integer, value: 1 },
        { name: 'disadvantage', type: ApplicationCommandOptionType.Integer, value: 1 },
        { name: 'beginners-luck', type: ApplicationCommandOptionType.Boolean, value: true },
      ]),
      queuedRng(6, 1),
    );
    expect(contentOf(roll)).toContain("2D Black Beginner's Luck vs Ob 3");

    const [customId = ''] = customIds(roll);
    const spend = {
      ...inGuild(ROLLER),
      data: { custom_id: customId },
      message: { content: rawContentOf(roll) },
    } as unknown as APIMessageComponentButtonInteraction;
    const response = HandleButton(spend, queuedRng(5));
    expect(contentOf(response)).toContain("2D Black Beginner's Luck vs Ob 3");
    expect(contentOf(response)).toContain('(Difficult test, counts toward the root stat)');
  });

  it('works in a DM', () => {
    const interaction = {
      ...inDm(ROLLER),
      data: {
        options: [{ name: 'dice', type: ApplicationCommandOptionType.Integer, value: 1 }],
      },
    } as unknown as APIChatInputApplicationCommandInteraction;
    expect(customIds(HandleRoll(interaction, queuedRng(1)))[0]).toContain(`:${ROLLER}:`);
  });

  it('shows the server emojis', () => {
    const response = HandleRoll(
      rollInteraction([{ name: 'dice', type: ApplicationCommandOptionType.Integer, value: 2 }]),
      queuedRng(4, 1),
      { diceEmojis: EMOJIS },
    );
    expect(contentOf(response)).toBe('2D Black → [4️⃣ 1️⃣] = 1 success');
  });
});

describe('handleRollSettings', () => {
  const GUILD = '999';

  function settingsInteraction(
    subcommand: string,
    emojis?: string,
    guildId: string | undefined = GUILD,
  ) {
    const options =
      emojis === undefined
        ? undefined
        : [{ name: 'emojis', type: ApplicationCommandOptionType.String, value: emojis }];
    return {
      guild_id: guildId,
      data: {
        options: [{ name: subcommand, type: ApplicationCommandOptionType.Subcommand, options }],
      },
    } as unknown as APIChatInputApplicationCommandInteraction;
  }

  it('saves six emojis for the server', async () => {
    const store = memoryStore();
    const response = await HandleRollSettings(
      settingsInteraction('dice-emojis', EMOJIS.join(' ')),
      store,
    );
    expect(isEphemeral(response)).toBe(true);
    expect(await LoadSettings(store, GUILD)).toEqual({ diceEmojis: EMOJIS });
  });

  it('rejects anything other than six emojis without saving', async () => {
    const store = memoryStore();
    const response = await HandleRollSettings(settingsInteraction('dice-emojis', '1️⃣ 2️⃣'), store);
    expect(isEphemeral(response)).toBe(true);
    expect(store.values.size).toBe(0);
  });

  it('reports a failed write instead of throwing', async () => {
    const down = () => Promise.reject(new Error('down'));
    const store = { ...memoryStore(), put: down, delete: down };
    for (const interaction of [
      settingsInteraction('dice-emojis', EMOJIS.join(' ')),
      settingsInteraction('delete'),
    ]) {
      const response = await HandleRollSettings(interaction, store);
      expect(isEphemeral(response)).toBe(true);
      expect(contentOf(response)).toBe('Settings could not be saved. Try again in a minute.');
    }
  });

  it('deletes the server settings', async () => {
    const store = memoryStore();
    await SaveSettings(store, GUILD, { diceEmojis: EMOJIS });
    const response = await HandleRollSettings(settingsInteraction('delete'), store);
    expect(isEphemeral(response)).toBe(true);
    expect(store.values.size).toBe(0);
  });
});

describe('handleButton', () => {
  it('explodes 6s when Fate is spent on a closed roll', () => {
    const response = HandleButton(click('fate', closed), queuedRng(4));
    expect(response.type).toBe(InteractionResponseType.UpdateMessage);
    expect(contentOf(response)).toBe(
      '✔ PASS (+0) (Routine test)\n3D Black vs Ob 2 → [6!, 4, 3, 1] = 2 successes\nSpent Fate: exploded 6s',
    );
  });

  it('rerolls one failure when Fate is spent on an open roll', () => {
    const response = HandleButton(click('fate', exploded(true)), queuedRng(5));
    expect(contentOf(response)).toContain('[6!, 5, 1]');
    expect(contentOf(response)).toContain('Spent Fate: rerolled 1 failure');
  });

  it('does not explode rerolled 6s on a closed roll', () => {
    expect(contentOf(HandleButton(click('deeds', closed), queuedRng(6, 6)))).toContain('[6, 6, 6]');
  });

  it('explodes rerolled 6s after Fate has opened the roll', () => {
    const response = HandleButton(click('deeds', exploded(false)), queuedRng(6, 1, 2));
    expect(contentOf(response)).toContain('[6!, 6!, 2, 1]');
  });

  it('keeps every spend line through a full sequence', () => {
    let state = closed;
    let content = 'first line';
    for (const [action, rng] of [
      ['fate', queuedRng(2)],
      ['deeds', queuedRng(1, 2, 3)],
      ['callon', queuedRng(5)],
    ] as const) {
      const response = HandleButton(click(action, state, inGuild(ROLLER), content), rng);
      content = rawContentOf(response);
      const [nextId] = customIds(response);
      if (nextId) state = { ...state, ...decodeNext(nextId) };
    }
    expect(plain(content).split('\n').slice(2)).toEqual([
      'Spent Fate: exploded 6s',
      'Spent Deeds: rerolled all failures',
      'Spent Call-on: rerolled 1 failure',
    ]);
  });

  it('keeps earlier spends from a message with an ansi block', () => {
    const old = '```ansi\nresult\nSpent Deeds: rerolled all failures\n```';
    const response = HandleButton(click('fate', closed, inGuild(ROLLER), old), queuedRng(4));
    expect(contentOf(response).split('\n').slice(2)).toEqual([
      'Spent Deeds: rerolled all failures',
      'Spent Fate: exploded 6s',
    ]);
  });

  it('shows the server emojis after a spend', () => {
    const response = HandleButton(click('callon', closed), queuedRng(5), { diceEmojis: EMOJIS });
    expect(contentOf(response)).toContain('[6️⃣ 5️⃣ 1️⃣]');
  });

  it('accepts the roller in a DM', () => {
    const response = HandleButton(click('callon', closed, inDm(ROLLER)), queuedRng(5));
    expect(response.type).toBe(InteractionResponseType.UpdateMessage);
  });

  it('rejects other users without rolling', () => {
    const response = HandleButton(click('deeds', closed, inGuild('222')), queuedRng());
    expect(isEphemeral(response)).toBe(true);
    expect(contentOf(response)).toBe('Only the roller can spend on this roll.');
  });

  it('rejects a second spend without rolling', () => {
    expect(isEphemeral(HandleButton(click('deeds', { ...closed, deeds: true }), queuedRng()))).toBe(
      true,
    );
  });

  it('rejects an unreadable custom_id', () => {
    const interaction = {
      ...inGuild(ROLLER),
      data: { custom_id: 'garbage' },
      message: { content: '' },
    } as unknown as APIMessageComponentButtonInteraction;
    expect(isEphemeral(HandleButton(interaction, queuedRng()))).toBe(true);
  });
});

function decodeNext(customId: string): RollState {
  const decoded = DecodeState(customId);
  if (!decoded) throw new Error(`Bad custom_id ${customId}`);
  return decoded.state;
}
