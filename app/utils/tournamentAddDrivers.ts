import { prisma } from "./prisma.server";
import invariant from "./invariant";

interface AddDriversOptions {
  createLaps?: boolean;
}

/**
 * Adds new drivers to a tournament
 * @param tournamentId - The tournament ID
 * @param driverIds - Array of driver IDs to add
 * @param options.createLaps - If true, creates qualifying laps for the new drivers
 */
export const tournamentAddDrivers = async (
  tournamentId: string,
  driverIds: number[],
  options: AddDriversOptions = {},
) => {
  const { createLaps = false } = options;

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id: tournamentId,
    },
    include: {
      drivers: {
        orderBy: {
          tournamentDriverNumber: "desc",
        },
        take: 1,
      },
    },
  });

  invariant(tournament, "Tournament not found");

  if (driverIds.length === 0) {
    return;
  }

  // Get the highest existing driver number to continue from
  const highestDriverNumber =
    tournament.drivers[0]?.tournamentDriverNumber ?? 0;

  // Create all the new drivers
  const newDrivers = await prisma.tournamentDrivers.createManyAndReturn({
    data: driverIds.map((driverId, index) => ({
      tournamentId,
      driverId,
      tournamentDriverNumber: highestDriverNumber + index + 1,
    })),
  });

  // Create laps for the new drivers if requested
  if (createLaps && tournament.enableQualifying) {
    await prisma.laps.createMany({
      data: Array.from({ length: tournament.qualifyingLaps }).flatMap(
        (_, lapIndex) => {
          return newDrivers.map((driver) => ({
            tournamentDriverId: driver.id,
            round: lapIndex + 1,
          }));
        },
      ),
    });
  }
};
