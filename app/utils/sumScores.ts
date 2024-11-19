import type { LapScores } from "@prisma/client";

export const sumScores = (lapScores: LapScores[], totalJudges: number) =>
  Math.ceil(
    lapScores.reduce((agg, lapScore) => agg + lapScore.score, 0) / totalJudges
  );
