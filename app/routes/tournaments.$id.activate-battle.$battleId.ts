import { redirect, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const referer = args.request.headers.get("Referer");
  const { id, battleId } = z
    .object({ id: z.string(), battleId: z.coerce.number() })
    .parse(params);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const battle = await prisma.tournamentBattles.findUnique({
    where: {
      id: battleId,
      tournamentId: id,
      driverLeftId: { not: null },
      driverRightId: { not: null },
    },
  });

  notFoundInvariant(battle, "Battle not found");

  await prisma.tournaments.update({
    where: { id, userId },
    data: {
      nextBattleId: battleId,
    },
  });

  return redirect(referer ?? `/tournaments/${id}/overview`);
};
