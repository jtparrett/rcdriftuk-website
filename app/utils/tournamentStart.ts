import { TournamentsState } from "~/utils/enums";
import { findNextIncompleteQualifyingLap } from "~/utils/findNextIncompleteQualifyingLap";
import { prisma } from "~/utils/prisma.server";
import { tournamentSeedBattles } from "~/utils/tournamentSeedBattles";
import invariant from "~/utils/invariant";
import { setQualifyingPositions } from "./setQualifyingPositions";

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
    const firstLap = await findNextIncompleteQualifyingLap(
      id,
      tournament.qualifyingOrder,
    );

    await prisma.tournaments.update({
      where: { id },
      data: {
        state: TournamentsState.QUALIFYING,
        nextQualifyingLapId: firstLap?.id ?? null,
      },
    });
  } else if (tournament.enableBattles) {
    await setQualifyingPositions(id);
    await tournamentSeedBattles(id);
    await prisma.tournaments.update({
      where: { id },
      data: {
        state: TournamentsState.BATTLES,
      },
    });
  }
};
