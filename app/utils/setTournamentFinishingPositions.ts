import { getSingleTournamentStandings } from "./getTournamentStandings";
import { prisma } from "./prisma.server";

/**
 * Fetches tournament data in the shape required by getSingleTournamentStandings
 */
async function getTournamentForStandings(tournamentId: string) {
  return prisma.tournaments.findFirst({
    where: {
      id: tournamentId,
    },
    select: {
      id: true,
      format: true,
      enableQualifying: true,
      enableBattles: true,
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
      battles: {
        orderBy: [{ round: "asc" }, { bracket: "asc" }, { id: "asc" }],
        select: {
          id: true,
          winnerId: true,
          bracket: true,
          round: true,
          driverLeft: {
            select: {
              isBye: true,
              id: true,
              qualifyingPosition: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  image: true,
                  driverId: true,
                  team: true,
                },
              },
            },
          },
          driverRight: {
            select: {
              isBye: true,
              id: true,
              qualifyingPosition: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  image: true,
                  driverId: true,
                  team: true,
                },
              },
            },
          },
        },
      },
      drivers: {
        select: {
          id: true,
          qualifyingPosition: true,
          isBye: true,
          tournamentDriverNumber: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              image: true,
              driverId: true,
              team: true,
            },
          },
          laps: {
            orderBy: {
              id: "asc",
            },
            select: {
              penalty: true,
              scores: {
                select: {
                  score: true,
                  judgeId: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Updates all of a tournament's drivers with their finishing positions based on
 * the same logic as getTournamentStandings (battle results or qualifying order).
 * Call this when a tournament is ended (state set to END).
 */
export async function setTournamentFinishingPositions(
  tournamentId: string,
): Promise<void> {
  const tournament = await getTournamentForStandings(tournamentId);

  if (!tournament) {
    return;
  }

  const standings = getSingleTournamentStandings(tournament);

  await prisma.$transaction(async (tx) => {
    for (const { stats, position } of standings) {
      await tx.tournamentDrivers.update({
        where: { id: stats.id },
        data: { finishingPosition: position },
      });
    }
  });
}
