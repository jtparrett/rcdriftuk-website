import { sortByInnerOuter } from "~/utils/innerOuterSorting";

/**
 * After inner/outer reordering, first-round pair index that holds seed 1 vs seed N
 * (original unsorted index 0). The bump winner fills the worst-seed side (left in raw pair 0).
 */
export function getBumpPairIndexForFirstRound(bracketSize: number): number {
  const rawPairs = Array.from({ length: bracketSize / 2 }, (_, i) => ({
    pairIndex: i,
  }));
  const sortedPairs = sortByInnerOuter(rawPairs);
  return sortedPairs.findIndex((p) => p.pairIndex === 0);
}
