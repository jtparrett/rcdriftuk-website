import { prisma } from "./prisma.server";

/**
 * Removes drivers from a tournament and their associated data
 * @param tournamentId - The tournament ID
 * @param driverIds - Array of driver IDs to remove
 */
export const tournamentRemoveDrivers = async (
  tournamentId: string,
  driverIds: number[],
) => {
  if (driverIds.length === 0) {
    return;
  }

  // Get the tournament driver IDs for the given driver IDs
  const tournamentDrivers = await prisma.tournamentDrivers.findMany({
    where: {
      tournamentId,
      driverId: {
        in: driverIds,
      },
    },
    select: {
      id: true,
    },
  });

  const tournamentDriverIds = tournamentDrivers.map((d) => d.id);

  if (tournamentDriverIds.length === 0) {
    return;
  }

  // Delete lap scores, laps, and tournament drivers in a transaction
  await prisma.$transaction([
    prisma.lapScores.deleteMany({
      where: {
        lap: {
          tournamentDriverId: {
            in: tournamentDriverIds,
          },
        },
      },
    }),
    prisma.laps.deleteMany({
      where: {
        tournamentDriverId: {
          in: tournamentDriverIds,
        },
      },
    }),
    prisma.tournamentDrivers.deleteMany({
      where: {
        id: {
          in: tournamentDriverIds,
        },
      },
    }),
  ]);
};
