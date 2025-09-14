import { BattlesBracket, TournamentsFormat } from "~/utils/enums";

export const getBracketName = (
  round: number,
  bracket: BattlesBracket,
  totalBattles: number,
) => {
  if (round === 1000 && bracket === BattlesBracket.UPPER) {
    return "Final";
  }

  if (totalBattles === 1 && bracket === BattlesBracket.UPPER) {
    return "Playoff";
  }

  return `Top ${totalBattles * 2}`;
};
