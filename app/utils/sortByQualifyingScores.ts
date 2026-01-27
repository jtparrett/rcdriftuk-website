/**
 * Comparator function for sorting drivers by their qualifying lap scores.
 *
 * Sorts by:
 * 1. Best lap score (descending)
 * 2. Second-best lap score (descending)
 * 3. Third-best lap score (descending)
 * 4. Tiebreaker value (ascending) - typically tournament driver number
 *
 * @param lapScoresA - Array of lap scores for driver A
 * @param lapScoresB - Array of lap scores for driver B
 * @param tiebreakerA - Tiebreaker value for driver A (e.g., tournament driver number)
 * @param tiebreakerB - Tiebreaker value for driver B
 * @returns Negative if A should come first, positive if B should come first, 0 if equal
 */
export const compareQualifyingScores = (
  lapScoresA: number[],
  lapScoresB: number[],
  tiebreakerA: number,
  tiebreakerB: number,
): number => {
  const [bestA = -1, secondA = -1, thirdA = -1] = [...lapScoresA].sort(
    (a, b) => b - a,
  );
  const [bestB = -1, secondB = -1, thirdB = -1] = [...lapScoresB].sort(
    (a, b) => b - a,
  );

  return (
    bestB - bestA ||
    secondB - secondA ||
    thirdB - thirdA ||
    tiebreakerA - tiebreakerB
  );
};

/**
 * Generic type for a driver with lap scores and a tiebreaker field.
 */
type DriverWithScores<T> = T & {
  lapScores: number[];
};

/**
 * Sorts an array of drivers by their qualifying lap scores.
 *
 * @param drivers - Array of drivers with lapScores property
 * @param getTiebreaker - Function to extract the tiebreaker value from a driver
 * @returns New sorted array (does not mutate the original)
 */
export const sortByQualifyingScores = <T>(
  drivers: DriverWithScores<T>[],
  getTiebreaker: (driver: DriverWithScores<T>) => number,
): DriverWithScores<T>[] => {
  return [...drivers].sort((a, b) =>
    compareQualifyingScores(
      a.lapScores,
      b.lapScores,
      getTiebreaker(a),
      getTiebreaker(b),
    ),
  );
};
