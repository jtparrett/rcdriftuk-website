import { redirect, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const trackId = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const track = await prisma.tracks.findUnique({
    where: {
      id: trackId,
      Owners: {
        some: {
          userId,
        },
      },
    },
  });

  if (!track) {
    return new Response("Track not found", { status: 404 });
  }

  const formData = await request.formData();
  const tournaments = formData.getAll("tournaments");

  const tournamentIds = z.array(z.string()).parse(tournaments);

  await prisma.trackTournaments.deleteMany({
    where: {
      trackId,
    },
  });

  await prisma.trackTournaments.createMany({
    data: tournamentIds.map((tournamentId) => ({
      trackId,
      tournamentId,
    })),
  });

  return redirect(`/tracks/${track.slug}/leaderboard`);
};
