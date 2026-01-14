import { prisma } from "./prisma.server";
import invariant from "./invariant";

/**
 * Deletes all existing qualifying laps and creates new ones for all drivers
 * @param tournamentId - The tournament ID
 */
export const tournamentCreateLaps = async (tournamentId: string) => {
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id: tournamentId,
    },
    include: {
      drivers: {
        orderBy: {
          tournamentDriverNumber: "asc",
        },
      },
    },
  });

  invariant(tournament, "Tournament not found");

  const tournamentDriverIds = tournament.drivers.map((d) => d.id);

  // Delete existing lap scores
  await prisma.lapScores.deleteMany({
    where: {
      lap: {
        tournamentDriverId: {
          in: tournamentDriverIds,
        },
      },
    },
  });

  // Delete existing laps
  await prisma.laps.deleteMany({
    where: {
      tournamentDriverId: {
        in: tournamentDriverIds,
      },
    },
  });

  // Create new laps for each driver based on qualifyingLaps count
  if (tournament.drivers.length > 0) {
    await prisma.laps.createMany({
      data: Array.from({ length: tournament.qualifyingLaps }).flatMap(
        (_, lapIndex) => {
          return tournament.drivers.map((driver) => ({
            tournamentDriverId: driver.id,
            round: lapIndex + 1,
          }));
        },
      ),
    });
  }
};
