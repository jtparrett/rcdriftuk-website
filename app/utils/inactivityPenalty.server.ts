// Calculate inactivity penalty based on time since last battle
export const calculateInactivityPenaltyOverPeriod = (
  startDate: Date | null,
  endDate: Date,
): number => {
  if (!startDate) {
    return 0;
  }

  const timeDiffMs = endDate.getTime() - startDate.getTime();
  const timeDiffYears = timeDiffMs / (1000 * 60 * 60 * 24 * 365.25); // Account for leap years

  if (timeDiffYears < 1) {
    return 0; // No penalty if less than a year
  }

  // -100 points per year, calculated proportionally
  return Math.floor((timeDiffYears - 1) * -100);
};
