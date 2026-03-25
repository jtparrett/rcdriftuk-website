import { BattlesBracket } from "~/utils/enums";
import { TOURNAMENT_STAGE_ROUND_BASE } from "~/utils/tournamentStageRounds";

function localRound(round: number): number {
  return round % TOURNAMENT_STAGE_ROUND_BASE;
}

export const getBracketName = (
  round: number,
  bracket: BattlesBracket,
  totalBattles: number,
) => {
  const lr = localRound(round);

  if (lr === 1000 && bracket === BattlesBracket.UPPER) {
    return "Final";
  }

  if (lr === 1001) {
    return "Semi Final";
  }

  if (lr === 1002) {
    return "Grand Final";
  }

  if (totalBattles === 1 && bracket === BattlesBracket.UPPER) {
    return "Playoff";
  }

  return `Top ${totalBattles * 2}`;
};
