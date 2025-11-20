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

  if (timeDiffYears < 0.5) {
    return 0; // No penalty if less than 6 months
  }

  // -200 points per year, calculated proportionally (starts after 6 months)
  return Math.floor((timeDiffYears - 0.5) * -200);
};
