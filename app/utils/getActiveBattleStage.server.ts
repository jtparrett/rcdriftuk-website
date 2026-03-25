import { prisma } from "~/utils/prisma.server";

/**
 * First stage (by sortOrder) that still has at least one unfinished battle.
 */
export async function getActiveBattleStageId(
  tournamentId: string,
): Promise<string | null> {
  const stages = await prisma.tournamentBattleStages.findMany({
    where: { tournamentId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  for (const s of stages) {
    const n = await prisma.tournamentBattles.count({
      where: {
        tournamentId,
        stageId: s.id,
        winnerId: null,
      },
    });
    if (n > 0) return s.id;
  }

  return null;
}

/** Next unwon battle in the active stage that has both drivers assigned (excludes cross-stage TBD slots). */
export async function resolveNextReadyBattleId(
  tournamentId: string,
): Promise<number | null> {
  const activeStageId = await getActiveBattleStageId(tournamentId);
  if (!activeStageId) return null;

  const next = await prisma.tournamentBattles.findFirst({
    where: {
      tournamentId,
      stageId: activeStageId,
      winnerId: null,
      driverLeftId: { not: null },
      driverRightId: { not: null },
    },
    orderBy: [{ round: "asc" }, { bracket: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  return next?.id ?? null;
}
