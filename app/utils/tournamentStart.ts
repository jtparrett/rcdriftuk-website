import { TournamentsState } from "~/utils/enums";
import { prisma } from "~/utils/prisma.server";
import { tournamentSeedBattles } from "~/utils/tournamentSeedBattles";
import invariant from "~/utils/invariant";

/**
 * Starts a tournament by transitioning from START state to QUALIFYING or BATTLES
 * Creates laps for drivers and sets up the first qualifying lap or seeds battles
 */
export const tournamentStart = async (id: string) => {
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      state: TournamentsState.START,
    },
  });

  invariant(tournament, "Tournament not found or not in START state");

  if (tournament.enableQualifying) {
    // Find the first qualifying lap to set as next
    const firstLap = await prisma.laps.findFirst({
      where: {
        driver: {
          tournamentId: id,
        },
        scores: {
          none: {},
        },
      },
      orderBy: [{ round: "asc" }, { id: "asc" }],
    });

    await prisma.tournaments.update({
      where: { id },
      data: {
        state: TournamentsState.QUALIFYING,
        nextQualifyingLapId: firstLap?.id ?? null,
      },
    });
  } else if (tournament.enableBattles) {
    await prisma.tournaments.update({
      where: { id },
      data: {
        state: TournamentsState.BATTLES,
      },
    });
    await tournamentSeedBattles(id);
  } else {
    // No qualifying or battles enabled, go straight to END
    await prisma.tournaments.update({
      where: { id },
      data: {
        state: TournamentsState.END,
      },
    });
  }
};
