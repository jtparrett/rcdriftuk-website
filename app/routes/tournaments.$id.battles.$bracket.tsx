import { redirect, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { prisma } from "~/utils/prisma.server";
import { BattlesBracket } from "~/utils/enums";

/**
 * Legacy URL /tournaments/:id/battles/:bracket → first stage + bracket.
 */
export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const bracket = z
    .nativeEnum(BattlesBracket)
    .parse(args.params.bracket?.toUpperCase());

  const first = await prisma.tournamentBattleStages.findFirst({
    where: { tournamentId: id },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  if (!first) {
    return redirect(`/tournaments/${id}/overview`);
  }

  return redirect(`/tournaments/${id}/battles/${first.id}/${bracket}`);
};
