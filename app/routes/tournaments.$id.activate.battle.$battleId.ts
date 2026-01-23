import { redirect, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { commitBattleWinner } from "~/utils/commitBattleWinner";
import { TournamentsState } from "~/utils/enums";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

type Battle = {
  id: number;
  driverLeftId: number | null;
  driverRightId: number | null;
  winnerNextBattleId: number | null;
  loserNextBattleId: number | null;
};

/**
 * Undoes commitBattleWinner: clears the winner and removes the battle's
 * drivers from the immediate downstream battles.
 */
async function clearBattle(battle: Battle): Promise<void> {
  // Clear the winner
  await prisma.tournamentBattles.update({
    where: { id: battle.id },
    data: { winnerId: null },
  });

  const drivers = [battle.driverLeftId, battle.driverRightId].filter(
    (id): id is number => id !== null,
  );

  // Remove drivers from winner's next battle
  if (battle.winnerNextBattleId) {
    const next = await prisma.tournamentBattles.findFirst({
      where: { id: battle.winnerNextBattleId },
    });
    if (next) {
      const updates: { driverLeftId?: null; driverRightId?: null } = {};
      if (next.driverLeftId && drivers.includes(next.driverLeftId)) {
        updates.driverLeftId = null;
      }
      if (next.driverRightId && drivers.includes(next.driverRightId)) {
        updates.driverRightId = null;
      }
      if (Object.keys(updates).length > 0) {
        await prisma.tournamentBattles.update({
          where: { id: next.id },
          data: updates,
        });
      }
    }
  }

  // Remove drivers from loser's next battle
  if (battle.loserNextBattleId) {
    const next = await prisma.tournamentBattles.findFirst({
      where: { id: battle.loserNextBattleId },
    });
    if (next) {
      const updates: { driverLeftId?: null; driverRightId?: null } = {};
      if (next.driverLeftId && drivers.includes(next.driverLeftId)) {
        updates.driverLeftId = null;
      }
      if (next.driverRightId && drivers.includes(next.driverRightId)) {
        updates.driverRightId = null;
      }
      if (Object.keys(updates).length > 0) {
        await prisma.tournamentBattles.update({
          where: { id: next.id },
          data: updates,
        });
      }
    }
  }
}

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const battleId = z.coerce.number().parse(args.params.battleId);
  const referer =
    args.request.headers.get("Referer") ?? `/tournaments/${id}/overview`;

  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      userId,
      state: TournamentsState.BATTLES,
    },
    include: {
      judges: true,
      nextBattle: true,
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

  const battle = await prisma.tournamentBattles.findFirst({
    where: {
      id: battleId,
      tournamentId: id,
      round: tournament.nextBattle?.round,
      bracket: tournament.nextBattle?.bracket,
    },
  });

  if (!battle) {
    return redirect(referer);
  }

  if (tournament.nextBattle) {
    await commitBattleWinner(tournament.nextBattle, tournament.judges);
  }

  await clearBattle(battle);

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      nextBattleId: battleId,
    },
  });

  return redirect(referer);
};
