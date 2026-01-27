import { prisma } from "./prisma.server";
import invariant from "./invariant";

/**
 * Reorders drivers in a tournament by updating their tournament driver numbers
 * Does not modify laps - only updates the running order
 * @param tournamentId - The tournament ID
 * @param driverIds - Array of driver IDs in the new order
 */
export const tournamentReorderDrivers = async (
  tournamentId: string,
  driverIds: number[],
) => {
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id: tournamentId,
    },
    include: {
      drivers: true,
    },
  });

  invariant(tournament, "Tournament not found");

  if (driverIds.length === 0) {
    return;
  }

  // Update each driver's tournament number to match their position in the array
  await prisma.$transaction(
    driverIds.map((driverId, index) => {
      const driver = tournament.drivers.find((d) => d.driverId === driverId);

      invariant(driver, "Driver not found");

      return prisma.tournamentDrivers.update({
        where: {
          id: driver.id,
        },
        data: {
          tournamentDriverNumber: index + 1,
        },
      });
    }),
  );
};
