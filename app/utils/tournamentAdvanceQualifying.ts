import { prisma } from "./prisma.server";
import invariant from "./invariant";
import { QualifyingOrder, TournamentsState } from "./enums";

export const tournamentAdvanceQualifying = async (
  id: string,
  skipChecks?: boolean,
) => {
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      state: TournamentsState.QUALIFYING,
    },
    include: {
      judges: true,
      drivers: true,
      nextQualifyingLap: {
        include: {
          scores: true,
        },
      },
      _count: {
        select: {
          judges: true,
        },
      },
    },
  });

  invariant(tournament, "Tournament not found");

  invariant(
    skipChecks ||
      tournament?.judges.length ===
        tournament?.nextQualifyingLap?.scores.length,
    "Judging not complete for current lap",
  );

  let nextQualifyingLap = await prisma.laps.findFirst({
    where: {
      driver: {
        tournamentId: id,
      },
      scores: {
        none: {},
      },
    },
    orderBy:
      tournament.qualifyingOrder === QualifyingOrder.DRIVERS
        ? [
            {
              tournamentDriverId: "asc",
            },
            { id: "asc" },
          ]
        : [{ id: "asc" }],
  });

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      nextQualifyingLapId: nextQualifyingLap?.id ?? null,
    },
  });
};
