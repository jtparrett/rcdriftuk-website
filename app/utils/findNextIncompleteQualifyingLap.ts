import { QualifyingOrder } from "~/utils/enums";
import { prisma } from "~/utils/prisma.server";

/**
 * Finds the next qualifying lap that hasn't been fully judged.
 * A lap is considered incomplete if it has fewer scores than the number of judges.
 * This prevents laps from being skipped if only some judges have scored them.
 */
export const findNextIncompleteQualifyingLap = async (
  tournamentId: string,
  qualifyingOrder: QualifyingOrder,
) => {
  // Get the number of judges for this tournament
  const judgeCount = await prisma.tournamentJudges.count({
    where: { tournamentId },
  });

  // If there are no judges, there can be no incomplete laps
  if (judgeCount === 0) {
    return null;
  }

  // Find all laps for this tournament with their score counts
  const laps = await prisma.laps.findMany({
    where: {
      driver: {
        tournamentId,
      },
    },
    include: {
      driver: true,
      _count: {
        select: {
          scores: true,
        },
      },
    },
    orderBy:
      qualifyingOrder === QualifyingOrder.DRIVERS
        ? [
            {
              driver: {
                tournamentDriverNumber: "asc",
              },
            },
            { id: "asc" },
          ]
        : [{ round: "asc" }, { id: "asc" }],
  });

  // Find the first lap where the score count is less than the judge count
  const incompleteLap = laps.find((lap) => lap._count.scores < judgeCount);

  return incompleteLap ?? null;
};
