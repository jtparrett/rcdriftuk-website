import { BattlesBracket } from "@prisma/client";

export const getBracketName = (round: number, bracket: BattlesBracket) => {
  if (round === 1000) {
    return "🏆 Final 🏆";
  }

  return `Round ${round} - ${
    bracket === BattlesBracket.UPPER ? "Upper" : "Lower"
  }`;
};
