/** Namespace battle `round` values per stage so global ordering never mixes stages. */
export const TOURNAMENT_STAGE_ROUND_BASE = 10_000;

export function getStageRoundBase(sortOrder: number): number {
  return sortOrder * TOURNAMENT_STAGE_ROUND_BASE;
}

/** Stored Prisma `round` for a stage-local round number (1..totalRounds, 1000..1002, or playoff). */
export function toStageRound(sortOrder: number, localRound: number): number {
  return getStageRoundBase(sortOrder) + localRound;
}
