export type Rng = () => number;
export type Shade = "B" | "G" | "W";
export interface Die { value: number; exploded: boolean; }

const THRESHOLDS: Record<Shade, number> = { B: 4, G: 3, W: 2 };

export const SecureRng: Rng = () => {
  let byte: number | undefined;

  while (byte === undefined) {
    byte = crypto.getRandomValues(new Uint8Array(16)).find(candidate => candidate < 252);
  }

  return (byte % 6) + 1;
};

export function Threshold(shade: Shade): number {
  return THRESHOLDS[shade];
}

export function CountSuccesses(dice: Die[], shade: Shade): number {
  return dice.filter(die => die.value >= Threshold(shade)).length;
}

export function FailedIndexes(dice: Die[], shade: Shade): number[] {
  return dice.flatMap((die, i) => (die.value < Threshold(shade) ? [i] : []));
}

export function Explode(dice: Die[], rng: Rng): Die[] {
  const result = dice.map(die => ({ ...die }));

  for (const die of result) {
    if (die.value === 6 && !die.exploded) {
      die.exploded = true;
      result.push({ value: rng(), exploded: false });
    }
  }

  return result;
}

export function RollPool(n: number, open: boolean, rng: Rng): Die[] {
  const dice = Array.from({ length: n }, () => ({ value: rng(), exploded: false }));
  return open ? Explode(dice, rng) : dice;
}

function Reroll(dice: Die[], indexes: number[], exploding: boolean, rng: Rng): Die[] {
  const result = dice.map(die => ({ ...die }));
  for (const i of indexes) {
    result[i] = { value: rng(), exploded: false };
  }
  return exploding ? Explode(result, rng) : result;
}

export function RerollFailures(dice: Die[], shade: Shade, exploding: boolean, rng: Rng): Die[] {
  return Reroll(dice, FailedIndexes(dice, shade), exploding, rng);
}

export function RerollOne(dice: Die[], shade: Shade, exploding: boolean, rng: Rng): Die[] {
  return Reroll(dice, FailedIndexes(dice, shade).slice(0, 1), exploding, rng);
}
