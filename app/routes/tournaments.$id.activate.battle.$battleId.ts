import { redirect, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { commitBattleWinner } from "~/utils/commitBattleWinner";
import { TournamentsState } from "~/utils/enums";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

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
