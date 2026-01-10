import { redirect, type LoaderFunctionArgs } from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { tournamentCreateBattles } from "~/utils/tournamentCreateBattles";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not not found");

  const tournament = await prisma.tournaments.create({
    data: {
      name: "New Tournament",
      userId,
    },
  });

  await tournamentCreateBattles(tournament.id);

  return redirect(`/tournaments/${tournament.id}/setup`);
};
