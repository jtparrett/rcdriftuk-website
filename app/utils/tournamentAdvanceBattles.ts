import { TournamentsState } from "~/utils/enums";
import invariant from "~/utils/invariant";
import { prisma } from "~/utils/prisma.server";
import { autoAdvanceByeRuns } from "~/utils/autoAdvanceByeRuns.server";
import { commitBattleWinner } from "~/utils/commitBattleWinner";
import { resolveNextReadyBattleId } from "~/utils/getActiveBattleStage.server";

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

  // Verify all judges have voted before proceeding
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

  // Commit the battle winner
  const result = await commitBattleWinner(
    tournament.nextBattle,
    tournament.judges,
  );

  if (!result) {
    // It's OMT - Delete all votes and go again
    await prisma.tournamentBattleVotes.deleteMany({
      where: {
        battleId: tournament.nextBattle.id,
      },
    });

    return null;
  }

  const nextBattleId = await resolveNextReadyBattleId(id);

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      nextBattleId,
    },
  });

  // After advancing, check if the next battle is a bye run that needs auto-advancement
  await autoAdvanceByeRuns(id);
};
