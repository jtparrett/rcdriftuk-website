import { BattlesBracket, TournamentsFormat } from "~/utils/enums";

export const getBracketName = (
  round: number,
  bracket: BattlesBracket,
  format: TournamentsFormat,
) => {
  if (round === 1000) {
    return "Final";
  }

  if (format === TournamentsFormat.DOUBLE_ELIMINATION) {
    return `Round ${round} : ${
      bracket === BattlesBracket.UPPER ? "Upper" : "Lower"
    }`;
  }

  return `Round ${round}`;
};
