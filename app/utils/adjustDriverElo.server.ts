import { calculateInactivityPenaltyOverPeriod } from "./inactivityPenalty.server";

export const adjustDriverElo = (elo: number, lastBattleDate?: Date | null) => {
  if (!lastBattleDate) {
    return elo;
  }

  const inactivityPenalty = calculateInactivityPenaltyOverPeriod(
    lastBattleDate,
    new Date(),
  );

  return elo + inactivityPenalty;
};
