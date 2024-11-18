import { BattlesBracket, TournamentsFormat } from "@prisma/client";

export const getBracketName = (
  round: number,
  bracket: BattlesBracket,
  format: TournamentsFormat
) => {
  if (round === 1000) {
    return "🏆 Final 🏆";
  }

  if (format === TournamentsFormat.STANDARD) {
    return `Round ${round}`;
  }

  return `Round ${round} - ${
    bracket === BattlesBracket.UPPER ? "Upper" : "Lower"
  }`;
};
