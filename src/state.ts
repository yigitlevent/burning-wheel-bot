import type { Die, Shade } from "./dice.ts";


export type Action = "fate" | "deeds" | "callon";

export interface RollState {
  userId: string;
  shade: Shade;
  ob: number;
  pool: number;
  open: boolean;
  fate: boolean;
  deeds: boolean;
  callon: boolean;
  dice: Die[];
}

export const MaxCustomIdLength = 100;

const OPEN = 1;
const FATE = 2;
const DEEDS = 4;
const CALLON = 8;
const EXPLODED = "x";

const CustomId = /^(fate|deeds|callon):(\d{1,20}):([BGW]):(\d{1,2}):(\d{1,2}):([0-9a-f]):([1-6x]+)$/;

function EncodeFlags(state: RollState): string {
  const flags =
    (state.open ? OPEN : 0)
    | (state.fate ? FATE : 0)
    | (state.deeds ? DEEDS : 0)
    | (state.callon ? CALLON : 0);
  return flags.toString(16);
}

export function EncodeState(action: Action, state: RollState): string {
  const dice = state.dice.map(die => (die.exploded ? EXPLODED : String(die.value))).join("");
  return [action, state.userId, state.shade, state.ob, state.pool, EncodeFlags(state), dice].join(":");
}

export function DecodeState(customId: string): { action: Action; state: RollState; } | null {
  const match = CustomId.exec(customId);
  if (!match) return null;

  const [, action, userId, shade, ob, pool, flagText, diceText] = match;
  if (!userId || !flagText || !diceText) return null;

  const flags = parseInt(flagText, 16);

  return {
    action: action as Action,
    state: {
      userId,
      shade: shade as Shade,
      ob: Number(ob),
      pool: Number(pool),
      open: (flags & OPEN) !== 0,
      fate: (flags & FATE) !== 0,
      deeds: (flags & DEEDS) !== 0,
      callon: (flags & CALLON) !== 0,
      dice: Array.from(diceText, char =>
        char === EXPLODED
          ? { value: 6, exploded: true }
          : { value: Number(char), exploded: false }
      )
    }
  };
}
