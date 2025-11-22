import { TournamentsState } from "~/utils/enums";
import invariant from "~/utils/invariant";
import { prisma } from "~/utils/prisma.server";
import { autoAdvanceByeRuns } from "~/utils/autoAdvanceByeRuns.server";

const advanceToNextBattle = async (tournamentId: string) => {
  const nextBattle = await prisma.tournamentBattles.findFirst({
    where: {
      tournamentId,
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

  if (!nextBattle) {
    await prisma.tournaments.update({
      where: {
        id: tournamentId,
      },
      data: {
        nextBattleId: null,
        state: TournamentsState.END,
      },
    });

    return null;
  }

  await prisma.tournaments.update({
    where: {
      id: tournamentId,
    },
    data: {
      nextBattleId: nextBattle.id,
    },
  });

  return null;
};

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

  if (!tournament.nextBattleId || !tournament.nextBattle) {
    // End the comp!
    await advanceToNextBattle(id);

    return null;
  }

  const totalVotes = await prisma.tournamentBattleVotes.findMany({
    where: {
      battleId: tournament.nextBattleId,
    },
    select: {
      judgeId: true,
    },
    distinct: ["judgeId"],
  });

  invariant(totalVotes.length >= tournament.judges.length, "Still judging bro");

  const battleVotesLeft = await prisma.tournamentBattleVotes.findMany({
    where: {
      battleId: tournament.nextBattleId,
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
      battleId: tournament.nextBattleId,
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
        battleId: tournament.nextBattleId,
      },
    });

    return null;
  }

  await prisma.tournamentBattles.update({
    where: {
      id: tournament.nextBattleId,
    },
    data: {
      winnerId,
    },
  });

  const isUpdate =
    tournament.nextBattle.winnerId !== null &&
    winnerId !== tournament.nextBattle.winnerId;

  if (tournament.nextBattle.winnerNextBattleId) {
    const nextWinnerBattle = await prisma.tournamentBattles.findFirst({
      where: {
        id: tournament.nextBattle.winnerNextBattleId,
      },
    });

    if (isUpdate && nextWinnerBattle) {
      // This means it's an update, and the winner has changed
      // loserId is the previous winner, by assumption
      if (nextWinnerBattle.driverLeftId === loserId) {
        await prisma.tournamentBattles.update({
          where: {
            id: nextWinnerBattle.id,
          },
          data: {
            driverLeftId: winnerId,
          },
        });
      } else if (nextWinnerBattle.driverRightId === loserId) {
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

    // This is the regular flow (non update)
    if (nextWinnerBattle?.driverLeftId === null && !isUpdate) {
      await prisma.tournamentBattles.update({
        where: {
          id: nextWinnerBattle.id,
        },
        data: {
          driverLeftId: winnerId,
        },
      });
    } else if (nextWinnerBattle?.driverRightId === null && !isUpdate) {
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

    if (isUpdate && nextLoserBattle) {
      // This means it's an update, and the winner has changed
      // winnerId is the previous loser, by assumption
      if (nextLoserBattle.driverLeftId === winnerId) {
        await prisma.tournamentBattles.update({
          where: {
            id: nextLoserBattle.id,
          },
          data: {
            driverLeftId: loserId,
          },
        });
      } else if (nextLoserBattle.driverRightId === winnerId) {
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

    // This is the regular flow (non update)
    if (nextLoserBattle?.driverLeftId === null && !isUpdate) {
      await prisma.tournamentBattles.update({
        where: {
          id: nextLoserBattle.id,
        },
        data: {
          driverLeftId: loserId,
        },
      });
    } else if (nextLoserBattle?.driverRightId === null && !isUpdate) {
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

  await advanceToNextBattle(id);

  // After advancing, check if the next battle is a bye run that needs auto-advancement
  await autoAdvanceByeRuns(id);

  return null;
};
