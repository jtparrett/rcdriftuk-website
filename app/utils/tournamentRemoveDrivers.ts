import { prisma } from "./prisma.server";
import invariant from "./invariant";

/**
 * Removes drivers from a tournament and deletes their laps
 * @param tournamentId - The tournament ID
 * @param driverIds - Array of driver IDs to remove
 */
export const tournamentRemoveDrivers = async (
  tournamentId: string,
  driverIds: number[],
) => {
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id: tournamentId,
    },
    include: {
      drivers: {
        where: {
          driverId: {
            in: driverIds,
          },
        },
      },
    },
  });

  invariant(tournament, "Tournament not found");

  if (driverIds.length === 0) {
    return;
  }

  const tournamentDriverIds = tournament.drivers.map((d) => d.id);

  // Delete lap scores for the drivers' laps first
  await prisma.lapScores.deleteMany({
    where: {
      lap: {
        tournamentDriverId: {
          in: tournamentDriverIds,
        },
      },
    },
  });

  // Delete laps for the drivers
  await prisma.laps.deleteMany({
    where: {
      tournamentDriverId: {
        in: tournamentDriverIds,
      },
    },
  });

  // Delete the tournament drivers
  await prisma.tournamentDrivers.deleteMany({
    where: {
      id: {
        in: tournamentDriverIds,
      },
    },
  });
};
