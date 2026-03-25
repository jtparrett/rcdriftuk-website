export type StageAllocSpec = {
  id: string;
  sortOrder: number;
  bracketSize: number;
};

/**
 * Cascade allocation (best → worst in `sortedDriverIds`):
 * - Last stage takes up to (bracketSize - 1) from the front of the pool (one slot reserved for bump).
 * - Each earlier non-first stage same.
 * - First stage gets everyone still in the pool (may be more than B1; seeding caps to B1 like a single bracket).
 *
 * Shortfalls vs ideal counts are filled with bye runs at seed time, same spirit as legacy single-bracket.
 */
export function allocateDriverIdsToStages(
  sortedDriverIds: number[],
  stages: StageAllocSpec[],
): Map<string, number[]> {
  const byStage = new Map<string, number[]>();
  const ordered = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  if (ordered.length === 0) return byStage;
  if (ordered.length === 1) {
    byStage.set(ordered[0]!.id, [...sortedDriverIds]);
    return byStage;
  }

  let pool = [...sortedDriverIds];
  const n = ordered.length;

  for (let idx = n - 1; idx >= 1; idx--) {
    const st = ordered[idx]!;
    const want = st.bracketSize - 1;
    const take = Math.min(want, pool.length);
    byStage.set(st.id, pool.slice(0, take));
    pool = pool.slice(take);
  }

  byStage.set(ordered[0]!.id, pool);
  return byStage;
}
