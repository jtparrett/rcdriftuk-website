import { TournamentsFormat, TournamentsState } from "~/utils/enums";
import invariant from "~/utils/invariant";
import {
  advanceDoubleEliminationBattleWinner,
  advanceSingleEliminationBattleWinner,
} from "~/utils/tournament.server";
import { prisma } from "~/utils/prisma.server";
import { autoAdvanceByeRuns } from "~/utils/autoAdvanceByeRuns";

const advanceToNextBattle = async (
  tournamentId: string,
  format: TournamentsFormat,
) => {
  const nextBattle = await prisma.tournamentBattles.findFirst({
    where: {
      tournamentId,
      winnerId: null,
    },
    orderBy: [
      ...(format === TournamentsFormat.WILDCARD
        ? ([{ bracket: "desc" }, { round: "asc" }] as const)
        : ([{ round: "asc" }, { bracket: "asc" }] as const)),
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

export const tournamentNextBattle = async (id: string) => {
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
    await advanceToNextBattle(id, tournament.format);
    // After setting next battle, check if it's a bye run that needs auto-advancement
    await autoAdvanceByeRuns(id);
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

  if (!winnerId) {
    // It's OMT - Delete all votes and go again
    await prisma.tournamentBattleVotes.deleteMany({
      where: {
        battleId: tournament.nextBattleId,
      },
    });
  }

  if (
    winnerId &&
    (tournament.format === TournamentsFormat.STANDARD ||
      tournament.format === TournamentsFormat.WILDCARD)
  ) {
    await advanceSingleEliminationBattleWinner({
      tournamentId: id,
      battleId: tournament.nextBattleId,
      winnerId,
      format: tournament.format,
    });

    await advanceToNextBattle(id, tournament.format);

    // After advancing, check if the next battle is a bye run that needs auto-advancement
    await autoAdvanceByeRuns(id);

    return null;
  }

  if (winnerId && tournament.format === TournamentsFormat.DOUBLE_ELIMINATION) {
    await advanceDoubleEliminationBattleWinner({
      tournamentId: id,
      battleId: tournament.nextBattleId,
      winnerId,
    });

    await advanceToNextBattle(id, tournament.format);

    // After advancing, check if the next battle is a bye run that needs auto-advancement
    await autoAdvanceByeRuns(id);

    return null;
  }

  if (winnerId && tournament.format === TournamentsFormat.EXHIBITION) {
    await prisma.tournamentBattles.update({
      where: {
        id: tournament.nextBattleId,
      },
      data: {
        winnerId,
      },
    });

    await advanceToNextBattle(id, tournament.format);

    // After advancing, check if the next battle is a bye run that needs auto-advancement
    await autoAdvanceByeRuns(id);

    return null;
  }
};
