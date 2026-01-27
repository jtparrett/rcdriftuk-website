import invariant from "~/utils/invariant";
import { prisma } from "~/utils/prisma.server";
import { sortByQualifyingScores } from "~/utils/sortByQualifyingScores";
import { sumScores } from "~/utils/sumScores";

/**
 * Sets qualifying positions for all drivers in a tournament based on their lap scores.
 * Should be called when qualifying ends, before transitioning to battles or end state.
 */
export const setQualifyingPositions = async (id: string) => {
  const tournament = await prisma.tournaments.findUnique({
    where: {
      id,
    },
    select: {
      scoreFormula: true,
      _count: {
        select: {
          judges: true,
        },
      },
      judges: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
        },
      },
      drivers: {
        where: {
          isBye: false,
        },
        orderBy: {
          id: "asc",
        },
        include: {
          laps: {
            include: {
              scores: true,
            },
          },
        },
      },
    },
  });

  invariant(tournament, "Tournament not found");

  const judgeIds = tournament.judges.map((j) => j.id);

  const driversWithScores = tournament.drivers.map((driver) => {
    const lapScores = driver.laps.map((lap) =>
      sumScores(
        lap.scores,
        tournament._count.judges,
        tournament.scoreFormula,
        lap.penalty,
        judgeIds,
      ),
    );

    return {
      lapScores,
      id: driver.id,
      tournamentDriverNumber: driver.tournamentDriverNumber,
    };
  });

  const sortedDrivers = sortByQualifyingScores(
    driversWithScores,
    (d) => d.tournamentDriverNumber,
  );

  await prisma.$transaction(
    sortedDrivers.map((driver, i) => {
      return prisma.tournamentDrivers.update({
        where: {
          id: driver.id,
        },
        data: {
          qualifyingPosition: i + 1,
        },
      });
    }),
  );
};
