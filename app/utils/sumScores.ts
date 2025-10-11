import type { LapScores } from "@prisma/client";
import { ScoreFormula } from "./enums";

export const sumScores = (
  lapScores: LapScores[],
  totalJudges: number,
  scoreFormula: ScoreFormula = ScoreFormula.AVERAGED,
  penalty: number,
) => {
  const totalScore = lapScores.reduce(
    (agg, lapScore) => agg + lapScore.score,
    0,
  );

  if (scoreFormula === ScoreFormula.CUMULATIVE) {
    return Math.max(0, totalScore + penalty);
  }

  // Default to AVERAGED (maintaining backward compatibility)
  const total = Math.round((totalScore / totalJudges) * 100) / 100;

  return Math.max(0, total + penalty);
};
