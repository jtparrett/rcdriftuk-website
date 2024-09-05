import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { z } from "zod";
import { prisma } from "~/utils/prisma.server";

export const action = async ({ params }: ActionFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      judges: true,
      nextQualifyingLap: {
        include: {
          scores: true,
        },
      },
    },
  });

  invariant(
    tournament?.judges.length === tournament?.nextQualifyingLap?.scores.length,
    "Judging not complete for current lap"
  );

  const nextQualifyingLap = await prisma.laps.findFirst({
    where: {
      driver: {
        tournamentId: id,
      },
      scores: {
        none: {},
      },
    },
    orderBy: [
      {
        driver: {
          id: "asc",
        },
      },
      { id: "asc" },
    ],
  });

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      nextQualifyingLapId: nextQualifyingLap?.id ?? null,
    },
  });

  return redirect(`/tournaments/${id}/qualifying`);
};
