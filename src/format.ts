import { ButtonStyle, ComponentType, type APIActionRowComponent, type APIButtonComponentWithCustomId } from "discord-api-types/v10";

import { TestDifficulty } from "./advancement.ts";
import { CountSuccesses, FailedIndexes, Threshold, type Die, type Shade } from "./dice.ts";
import { AdvancementOb, EncodeState, FinalOb, MaxCustomIdLength, type Action, type RollState } from "./state.ts";


const ShadeNames: Record<Shade, string> = { B: "Black", G: "Grey", W: "White" };
const MaxContentLength = 2000;
const BeginnersLuckNotes: Record<TestDifficulty, string> = {
  "Routine": "counts toward learning the skill",
  "Difficult": "counts toward the root stat",
  "Challenging": "counts toward the root stat",
  "Routine or Difficult": "counts toward the skill or the root stat"
};

function NumberFace(die: Die, shade: Shade): string {
  const face = die.exploded ? "6!" : String(die.value);
  return die.value >= Threshold(shade) ? `**${face}**` : face;
}

function EmojiFace(die: Die, emojis: string[]): string {
  return `${emojis[die.value - 1]}${die.exploded ? "!" : ""}`;
}

function Faces(dice: Die[], shade: Shade, emojis?: string[]): string {
  const sorted = dice.toSorted((a, b) => b.value - a.value);
  return emojis
    ? sorted.map(die => EmojiFace(die, emojis)).join(" ")
    : sorted.map(die => NumberFace(die, shade)).join(", ");
}

function Content(state: RollState, spends: string[], faces: string): string {
  const { beginner, dice, open, pool, shade } = state;
  const ob = FinalOb(state);
  const successes = CountSuccesses(dice, shade);
  const noun = successes === 1 ? "success" : "successes";
  const opposition = ob > 0 ? ` vs Ob ${ob}` : "";
  const line = `${pool}D ${ShadeNames[shade]}${open ? " open-ended" : ""}${beginner ? " Beginner's Luck" : ""}${opposition} → [${faces}] = ${successes} ${noun}`;
  if (ob === 0) return [line, ...spends].join("\n");

  const margin = successes - ob;
  const outcome = margin >= 0 ? `✔ PASS (+${margin})` : `✖ FAIL (${margin})`;
  return [`${outcome}${DifficultyLabel(state)}`, line, ...spends].join("\n");
}

function DifficultyLabel(state: RollState): string {
  const difficulty = TestDifficulty(state.pool, AdvancementOb(state));
  if (!difficulty) return "";

  return state.beginner ? ` (${difficulty} test, ${BeginnersLuckNotes[difficulty]})` : ` (${difficulty} test)`;
}

export function ResultLine(state: RollState, spends: string[] = [], emojis?: string[]): string {
  const { dice, shade } = state;
  const content = Content(state, spends, Faces(dice, shade, emojis));
  return content.length > MaxContentLength ? Content(state, spends, Faces(dice, shade)) : content;
}

export function DieOfFateLine(value: number, emojis?: string[]): string {
  return `Die of Fate → [${emojis?.[value - 1] ?? value}]`;
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
