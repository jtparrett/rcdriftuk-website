import { TournamentsState } from "~/utils/enums";
import { prisma } from "~/utils/prisma.server";

// Recursively auto-advance bye runs by creating votes for all judges
export const autoAdvanceByeRuns = async (
  tournamentId: string,
): Promise<void> => {
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id: tournamentId,
      state: TournamentsState.BATTLES,
    },
    include: {
      judges: true,
      nextBattle: {
        include: {
          driverLeft: true,
          driverRight: true,
        },
      },
    },
  });

  if (!tournament?.nextBattle) {
    return;
  }

  const { nextBattle, judges } = tournament;
  const isLeftBye = nextBattle.driverLeft?.isBye ?? false;
  const isRightBye = nextBattle.driverRight?.isBye ?? false;

  // If neither driver is a bye, no auto-advancement needed
  if (!isLeftBye && !isRightBye) {
    return;
  }

  // Determine winner: if both are bye runs, left wins; otherwise the non-bye driver wins
  let winnerId: number | null = null;
  if (isLeftBye && isRightBye) {
    // Both are bye runs, left driver wins
    winnerId = nextBattle.driverLeftId;
  } else if (isLeftBye && !isRightBye) {
    // Left is bye, right driver wins
    winnerId = nextBattle.driverRightId;
  } else if (!isLeftBye && isRightBye) {
    // Right is bye, left driver wins
    winnerId = nextBattle.driverLeftId;
  }

  if (!winnerId) {
    return;
  }

  // Create votes for all judges to automatically advance the bye run
  await prisma.tournamentBattleVotes.createMany({
    data: judges.map((judge) => ({
      judgeId: judge.id,
      battleId: nextBattle.id,
      winnerId,
      omt: false,
    })),
  });

  // Import the tournamentNextBattle function and call it to process the bye run
  const { tournamentNextBattle } = await import("~/utils/tournamentNextBattle");
  await tournamentNextBattle(tournamentId);
};
