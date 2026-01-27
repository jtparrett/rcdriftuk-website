import { redirect, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { TournamentsState } from "~/utils/enums";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const lapId = z.coerce.number().parse(args.params.lapId);
  const referer =
    args.request.headers.get("Referer") ?? `/tournaments/${id}/overview`;

  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      userId,
      state: TournamentsState.QUALIFYING,
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

  const lap = await prisma.laps.findFirst({
    where: {
      id: lapId,
      driver: {
        tournamentId: id,
      },
    },
  });

  notFoundInvariant(lap, "Lap not found");

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      nextQualifyingLapId: lapId,
    },
  });

  return redirect(referer);
};
