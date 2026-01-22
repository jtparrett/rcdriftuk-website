import { prisma } from "~/utils/prisma.server";

type BattleWithDrivers = {
  id: number;
  driverLeftId: number | null;
  driverRightId: number | null;
  winnerNextBattleId: number | null;
  loserNextBattleId: number | null;
};

type Judge = {
  id: string;
};

/**
 * Commits the winner of a battle based on judge votes.
 * Updates the battle with winnerId and places winner/loser in their downstream battles.
 *
 * @returns The winner and loser IDs if committed, null if OMT (tied) or not all judges voted
 */
export async function commitBattleWinner(
  battle: BattleWithDrivers,
  judges: Judge[],
): Promise<{ winnerId: number; loserId: number } | null> {
  const totalVotes = await prisma.tournamentBattleVotes.findMany({
    where: {
      battleId: battle.id,
    },
    select: {
      judgeId: true,
    },
    distinct: ["judgeId"],
  });

  // Not all judges have voted yet
  if (totalVotes.length < judges.length) {
    return null;
  }

  const battleVotesLeft = await prisma.tournamentBattleVotes.findMany({
    where: {
      battleId: battle.id,
      winnerId: battle.driverLeftId,
    },
    orderBy: {
      id: "desc",
    },
    select: {
      judgeId: true,
    },
    distinct: ["judgeId"],
  });

  const battleVotesRight = await prisma.tournamentBattleVotes.findMany({
    where: {
      battleId: battle.id,
      winnerId: battle.driverRightId,
    },
    orderBy: {
      id: "desc",
    },
    select: {
      judgeId: true,
    },
    distinct: ["judgeId"],
  });

  const winThreshold = Math.floor(judges.length / 2 + 1);

  const winnerId =
    battleVotesLeft.length >= winThreshold
      ? battle.driverLeftId
      : battleVotesRight.length >= winThreshold
        ? battle.driverRightId
        : null;

  // It's OMT (one more time) - no clear winner
  if (!winnerId) {
    return null;
  }

  const loserId =
    battle.driverLeftId === winnerId
      ? battle.driverRightId
      : battle.driverLeftId;

  if (!loserId) {
    return null;
  }

  // Update the battle with the winner
  await prisma.tournamentBattles.update({
    where: {
      id: battle.id,
    },
    data: {
      winnerId,
    },
  });

  // Place winner in their next battle
  if (battle.winnerNextBattleId) {
    const nextWinnerBattle = await prisma.tournamentBattles.findFirst({
      where: {
        id: battle.winnerNextBattleId,
      },
    });

    if (nextWinnerBattle?.driverLeftId === null) {
      await prisma.tournamentBattles.update({
        where: {
          id: nextWinnerBattle.id,
        },
        data: {
          driverLeftId: winnerId,
        },
      });
    } else if (nextWinnerBattle?.driverRightId === null) {
      await prisma.tournamentBattles.update({
        where: {
          id: nextWinnerBattle.id,
        },
        data: {
          driverRightId: winnerId,
        },
      });
    }
  }

  // Place loser in their next battle
  if (battle.loserNextBattleId) {
    const nextLoserBattle = await prisma.tournamentBattles.findFirst({
      where: {
        id: battle.loserNextBattleId,
      },
    });

    if (nextLoserBattle?.driverLeftId === null) {
      await prisma.tournamentBattles.update({
        where: {
          id: nextLoserBattle.id,
        },
        data: {
          driverLeftId: loserId,
        },
      });
    } else if (nextLoserBattle?.driverRightId === null) {
      await prisma.tournamentBattles.update({
        where: {
          id: nextLoserBattle.id,
        },
        data: {
          driverRightId: loserId,
        },
      });
    }
  }

  return { winnerId, loserId };
}
