import { redirect, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const id = z.coerce.number().parse(args.params.id);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const protest = await prisma.battleProtests.findUnique({
    where: {
      id,
      battle: {
        tournament: {
          userId,
        },
      },
    },
    select: {
      battle: {
        select: {
          tournamentId: true,
        },
      },
    },
  });

  notFoundInvariant(protest, "Protest not found");

  await prisma.battleProtests.update({
    where: { id },
    data: { resolved: true },
  });

  return redirect(`/tournaments/${protest.battle.tournamentId}/overview`);
};
