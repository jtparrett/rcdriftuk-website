import type { LapScores } from "@prisma/client";
import { ScoreFormula } from "./enums";

export const sumScores = (
  lapScores: LapScores[],
  totalJudges: number,
  scoreFormula: ScoreFormula = ScoreFormula.AVERAGE,
  penalty: number,
  judgeIds?: string[],
) => {
  const totalScore = lapScores.reduce(
    (agg, lapScore) => agg + lapScore.score,
    0,
  );

  // Handle legacy and simple formulas
  if (
    scoreFormula === ScoreFormula.CUMULATIVE ||
    scoreFormula === ScoreFormula.SUM
  ) {
    return Math.max(0, totalScore + penalty);
  }

  if (
    scoreFormula === ScoreFormula.AVERAGED ||
    scoreFormula === ScoreFormula.AVERAGE
  ) {
    const total = Math.round((totalScore / totalJudges) * 100) / 100;
    return Math.max(0, total + penalty);
  }

  // Handle head judge formulas (only for 3 judges)
  if (
    totalJudges === 3 &&
    judgeIds &&
    judgeIds.length === 3 &&
    lapScores.length >= 3
  ) {
    const scoreByJudge = new Map<string, number>();
    lapScores.forEach((ls) => scoreByJudge.set(ls.judgeId, ls.score));

    const scores = judgeIds.map((id) => scoreByJudge.get(id) ?? 0);
    const [scoreA, scoreB, scoreC] = scores;

    let total = 0;

    switch (scoreFormula) {
      case ScoreFormula.HEAD_JUDGE_1:
        // ((B + C) / 2) + A
        total = (scoreB + scoreC) / 2 + scoreA;
        break;
      case ScoreFormula.HEAD_JUDGE_2:
        // ((A + C) / 2) + B
        total = (scoreA + scoreC) / 2 + scoreB;
        break;
      case ScoreFormula.HEAD_JUDGE_3:
        // ((A + B) / 2) + C
        total = (scoreA + scoreB) / 2 + scoreC;
        break;
      default:
        // Fallback to average
        total = totalScore / totalJudges;
    }

    return Math.max(0, Math.round(total * 100) / 100 + penalty);
  }

  // Default fallback to average
  const total = Math.round((totalScore / totalJudges) * 100) / 100;
  return Math.max(0, total + penalty);
};
