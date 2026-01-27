import { prisma } from "./prisma.server";
import invariant from "./invariant";
import { TournamentsState } from "./enums";
import { findNextIncompleteQualifyingLap } from "./findNextIncompleteQualifyingLap";

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

  const nextQualifyingLap = await findNextIncompleteQualifyingLap(
    id,
    tournament.qualifyingOrder,
  );

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      nextQualifyingLapId: nextQualifyingLap?.id ?? null,
    },
  });
};
