export const getQualifyingWaveSize = (
  qualifyingLaps: number,
  index: number,
) => {
  if (qualifyingLaps === 1) {
    return 1;
  }

  if (qualifyingLaps === 2) {
    return [0.75, 0.25][Math.min(index - 1, 1)];
  }

  return [0.5, 0.25, 0.25][Math.min(index - 1, 2)];
};
