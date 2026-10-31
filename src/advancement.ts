export type TestDifficulty = "Routine" | "Difficult" | "Challenging" | "Routine or Difficult";

const RoutineLimits: readonly number[] = [1, 1, 2, 2, 3, 4];

export function TestDifficulty(pool: number, ob: number): TestDifficulty | null {
  if (ob === 0) return null;
  if (pool === 1 && ob === 1) return "Routine or Difficult";
  const routine = RoutineLimits[pool - 1] ?? pool - 3;
  if (ob <= routine) return "Routine";
  return ob <= pool ? "Difficult" : "Challenging";
}
