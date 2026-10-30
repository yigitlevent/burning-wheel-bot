export type TestDifficulty = "Routine" | "Difficult" | "Challenging" | "Routine or Difficult";

const DifficultyLimits: readonly (readonly [routine: number, difficult: number])[] = [
  [1, 1],
  [1, 2],
  [2, 3],
  [2, 4],
  [3, 5],
  [4, 6],
  [4, 7],
  [5, 8],
  [6, 9],
  [7, 10],
  [8, 11],
  [9, 12],
  [10, 13],
  [11, 14],
  [12, 15],
  [13, 16],
  [14, 17],
  [15, 18]
];

export function TestDifficulty(pool: number, ob: number): TestDifficulty | null {
  const limits = DifficultyLimits[pool - 1];
  if (ob === 0 || !limits) return null;
  if (pool === 1 && ob === 1) return "Routine or Difficult";
  const [routine, difficult] = limits;
  if (ob <= routine) return "Routine";
  return ob <= difficult ? "Difficult" : "Challenging";
}
