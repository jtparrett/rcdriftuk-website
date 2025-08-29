import type { LapScores } from "@prisma/client";
import { ScoreFormula } from "./enums";

export const sumScores = (
  lapScores: LapScores[],
  totalJudges: number,
  scoreFormula: ScoreFormula = ScoreFormula.AVERAGED,
) => {
  const totalScore = lapScores.reduce(
    (agg, lapScore) => agg + lapScore.score,
    0,
  );

  if (scoreFormula === ScoreFormula.CUMULATIVE) {
    return totalScore;
  }

  // Default to AVERAGED (maintaining backward compatibility)
  return Math.ceil(totalScore / totalJudges);
};
