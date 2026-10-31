import type { Die, Shade } from "./dice.ts";


export type Action = "fate" | "deeds" | "callon";

export interface RollState {
  userId: string;
  shade: Shade;
  ob: number;
  disadvantage: number;
  pool: number;
  open: boolean;
  beginner: boolean;
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
const BEGINNER = 16;
const EXPLODED = "x";

const CustomId = /^(fate|deeds|callon):(\d{1,20}):([BGW]):(\d{1,2})(?:\+(\d{1,2}))?:(\d{1,2}):([0-9a-f]{1,2}):([1-6x]+)$/;

export function FinalOb(state: RollState): number {
  return (state.beginner ? state.ob * 2 : state.ob) + state.disadvantage;
}

export function AdvancementOb(state: RollState): number {
  return state.ob + state.disadvantage;
}

function EncodeFlags(state: RollState): string {
  const flags =
    (state.open ? OPEN : 0)
    | (state.fate ? FATE : 0)
    | (state.deeds ? DEEDS : 0)
    | (state.callon ? CALLON : 0)
    | (state.beginner ? BEGINNER : 0);
  return flags.toString(16);
}

export function EncodeState(action: Action, state: RollState): string {
  const dice = state.dice.map(die => (die.exploded ? EXPLODED : String(die.value))).join("");
  const ob = state.disadvantage > 0 ? `${state.ob}+${state.disadvantage}` : state.ob;
  return [action, state.userId, state.shade, ob, state.pool, EncodeFlags(state), dice].join(":");
}

export function DecodeState(customId: string): { action: Action; state: RollState; } | null {
  const match = CustomId.exec(customId);
  if (!match) return null;

  const [, action, userId, shade, ob, disadvantage, pool, flagText, diceText] = match;
  if (!userId || !flagText || !diceText) return null;

  const flags = parseInt(flagText, 16);

  return {
    action: action as Action,
    state: {
      userId,
      shade: shade as Shade,
      ob: Number(ob),
      disadvantage: Number(disadvantage ?? 0),
      pool: Number(pool),
      open: (flags & OPEN) !== 0,
      beginner: (flags & BEGINNER) !== 0,
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
