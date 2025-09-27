export const getQualifyingWaveSize = (qualifyingLaps: number, run: number) => {
  if (qualifyingLaps === 1) return 1;

  const adjustedIndex = Math.min(run - 1, qualifyingLaps - 1);

  return adjustedIndex === 0 ? 1 - 0.25 * (qualifyingLaps - 1) : 0.25;
};
