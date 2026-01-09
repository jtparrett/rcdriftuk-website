import invariant from "./invariant";
import { prisma } from "./prisma.server";

// This should only delete laps without scores or judge has been removed
// And then only create new laps for remaining drivers with no laps

export const tournamentCreateLaps = async (id: string) => {
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      drivers: true,
    },
  });

  invariant(tournament, "Tournament not found");

  await prisma.laps.deleteMany({
    where: {
      tournamentDriverId: {
        in: tournament.drivers.map((driver) => driver.id),
      },
    },
  });

  const [nextQualifyingLap] = await prisma.laps.createManyAndReturn({
    data: Array.from({ length: tournament.qualifyingLaps }).flatMap((_, i) => {
      return tournament.drivers.map((driver) => {
        return {
          tournamentDriverId: driver.id,
          round: i + 1,
        };
      });
    }),
  });

  const nextQualifyingLapId = nextQualifyingLap?.id ?? null;

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      nextQualifyingLapId,
    },
  });
};
