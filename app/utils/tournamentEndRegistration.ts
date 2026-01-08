import { TournamentsState } from "./enums";
import invariant from "./invariant";
import { prisma } from "./prisma.server";
import { tournamentEndQualifying } from "./tournamentEndQualifying.server";

export const tournamentEndRegistration = async (id: string) => {
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      drivers: true,
    },
  });

  invariant(tournament, "Tournament not found");

  // Create qualifying laps
  let nextQualifyingLapId: number | null = null;

  if (tournament.enableQualifying) {
    const [_, [nextQualifyingLap]] = await prisma.$transaction([
      prisma.laps.deleteMany({
        where: {
          tournament: {
            id: tournament.id,
          },
        },
      }),
      prisma.laps.createManyAndReturn({
        data: Array.from({ length: tournament.qualifyingLaps }).flatMap(
          (_, i) => {
            return tournament.drivers.map((driver) => {
              return {
                tournamentDriverId: driver.id,
                round: i + 1,
              };
            });
          },
        ),
      }),
    ]);

    nextQualifyingLapId = nextQualifyingLap?.id ?? null;

    await prisma.tournaments.update({
      where: {
        id,
      },
      data: {
        nextQualifyingLapId,
        state: TournamentsState.QUALIFYING,
      },
    });
  } else if (tournament.enableBattles) {
    // battles only tournament
    await tournamentEndQualifying(id);
  }
};
