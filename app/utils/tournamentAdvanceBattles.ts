import { TournamentsState } from "~/utils/enums";
import invariant from "~/utils/invariant";
import { prisma } from "~/utils/prisma.server";
import { autoAdvanceByeRuns } from "~/utils/autoAdvanceByeRuns.server";

export const tournamentAdvanceBattles = async (id: string) => {
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      state: TournamentsState.BATTLES,
    },
    include: {
      judges: true,
      nextBattle: true,
    },
  });

  invariant(tournament, "Tournament not found");

  if (!tournament.nextBattle) {
    // battles are over
    return null;
  }

  const totalVotes = await prisma.tournamentBattleVotes.findMany({
    where: {
      battleId: tournament.nextBattle.id,
    },
    select: {
      judgeId: true,
    },
    distinct: ["judgeId"],
  });

  invariant(
    totalVotes.length >= tournament.judges.length,
    "Judging not complete for current battle",
  );

  const battleVotesLeft = await prisma.tournamentBattleVotes.findMany({
    where: {
      battleId: tournament.nextBattle.id,
      winnerId: tournament.nextBattle.driverLeftId,
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
      battleId: tournament.nextBattle.id,
      winnerId: tournament.nextBattle.driverRightId,
    },
    orderBy: {
      id: "desc",
    },
    select: {
      judgeId: true,
    },
    distinct: ["judgeId"],
  });

  const winThreshold = Math.floor(tournament.judges.length / 2 + 1);

  const winnerId =
    battleVotesLeft.length >= winThreshold
      ? tournament.nextBattle.driverLeftId
      : battleVotesRight.length >= winThreshold
        ? tournament.nextBattle.driverRightId
        : undefined;

  const loserId =
    tournament.nextBattle.driverLeftId === winnerId
      ? tournament.nextBattle.driverRightId
      : tournament.nextBattle.driverLeftId;

  if (!winnerId) {
    // It's OMT - Delete all votes and go again
    await prisma.tournamentBattleVotes.deleteMany({
      where: {
        battleId: tournament.nextBattle.id,
      },
    });

    return null;
  }

  // Update the current battle with the winner
  await prisma.tournamentBattles.update({
    where: {
      id: tournament.nextBattle.id,
    },
    data: {
      winnerId,
    },
  });

  if (tournament.nextBattle.winnerNextBattleId) {
    const nextWinnerBattle = await prisma.tournamentBattles.findFirst({
      where: {
        id: tournament.nextBattle.winnerNextBattleId,
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

  if (tournament.nextBattle.loserNextBattleId) {
    const nextLoserBattle = await prisma.tournamentBattles.findFirst({
      where: {
        id: tournament.nextBattle.loserNextBattleId,
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

  const nextBattle = await prisma.tournamentBattles.findFirst({
    where: {
      tournamentId: id,
      winnerId: null,
    },
    orderBy: [
      { round: "asc" },
      { bracket: "asc" },
      {
        id: "asc",
      },
    ],
    select: {
      id: true,
    },
  });

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      nextBattleId: nextBattle?.id ?? null,
    },
  });

  // After advancing, check if the next battle is a bye run that needs auto-advancement
  await autoAdvanceByeRuns(id);
};
