import { ButtonStyle, ComponentType, type APIActionRowComponent, type APIButtonComponentWithCustomId } from "discord-api-types/v10";

import { TestDifficulty } from "./advancement.ts";
import { CountSuccesses, FailedIndexes, Threshold, type Die, type Shade } from "./dice.ts";
import { EncodeState, MaxCustomIdLength, type Action, type RollState } from "./state.ts";


const ShadeNames: Record<Shade, string> = { B: "Black", G: "Grey", W: "White" };
const AnsiGreen = "\u001b[32m";
const AnsiRed = "\u001b[31m";
const AnsiReset = "\u001b[0m";

function ColoredDie(die: Die, shade: Shade): string {
  const color = die.value >= Threshold(shade) ? AnsiGreen : AnsiRed;
  return `${color}${die.exploded ? "6!" : die.value}${AnsiReset}`;
}

function AnsiBlock(text: string): string {
  return `\`\`\`ansi\n${text}\n\`\`\``;
}

export function ResultLine(state: RollState): string {
  const { dice, ob, open, pool, shade } = state;
  const successes = CountSuccesses(dice, shade);
  const faces = dice.toSorted((a, b) => b.value - a.value).map(die => ColoredDie(die, shade)).join(", ");
  const noun = successes === 1 ? "success" : "successes";
  const opposition = ob > 0 ? ` vs Ob ${ob}` : "";
  const line = `${pool}D ${ShadeNames[shade]}${open ? " open-ended" : ""}${opposition} → [${faces}] = ${successes} ${noun}`;
  if (ob === 0) return AnsiBlock(line);

  const margin = successes - ob;
  const outcome = margin >= 0 ? `✔ PASS (+${margin})` : `✖ FAIL (${margin})`;
  const difficulty = TestDifficulty(pool, ob);
  return AnsiBlock(`${outcome}${difficulty ? ` (${difficulty} test)` : ""}\n${line}`);
}

function Button(action: Action, label: string, disabled: boolean, state: RollState): APIButtonComponentWithCustomId {
  return {
    type: ComponentType.Button,
    style: ButtonStyle.Secondary,
    custom_id: EncodeState(action, state),
    label,
    disabled
  };
}

export function Buttons(state: RollState): APIActionRowComponent<APIButtonComponentWithCustomId>[] {
  const hasFailures = FailedIndexes(state.dice, state.shade).length > 0;
  const hasUnexplodedSixes = state.dice.some(die => die.value === 6 && !die.exploded);
  const row = [
    Button(
      "fate",
      state.open ? "Fate: reroll 1 failure" : "Fate: explode 6s",
      state.fate || !(state.open ? hasFailures : hasUnexplodedSixes),
      state
    ),
    Button("deeds", "Deeds: reroll failures", state.deeds || !hasFailures, state),
    Button("callon", "Call-on: reroll 1 failure", state.callon || !hasFailures, state)
  ];

  const allDisabled = row.every(component => component.disabled);
  const tooLong = row.some(component => component.custom_id.length > MaxCustomIdLength);
  return allDisabled || tooLong ? [] : [{ type: ComponentType.ActionRow, components: row }];
}
