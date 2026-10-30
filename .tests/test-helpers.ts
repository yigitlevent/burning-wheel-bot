import type { Die, Rng } from '../src/dice.ts';

/** Returns the queued values in order and throws if the code rolls more than expected. */
export function queuedRng(...values: number[]): Rng {
  const queue = [...values];
  return () => {
    const value = queue.shift();
    if (value === undefined) throw new Error('Rolled more dice than the test queued');
    return value;
  };
}

export function dice(...values: number[]): Die[] {
  return values.map((value) => ({ value, exploded: false }));
}
