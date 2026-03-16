import { calculateInactivityPenaltyOverPeriod } from "./inactivityPenalty.server";

export const adjustDriverElo = (
  elo: number,
  lastTournamentDate?: Date | null,
) => {
  if (!lastTournamentDate) {
    return elo;
  }

  const inactivityPenalty = calculateInactivityPenaltyOverPeriod(
    lastTournamentDate,
    new Date(),
  );

  return elo + inactivityPenalty;
};
