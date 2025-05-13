import { redirect, type LoaderFunctionArgs } from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { id } = args.params;
  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const event = await prisma.events.findUnique({
    where: {
      id,
      eventTrack: {
        Owners: {
          some: {
            userId,
          },
        },
      },
    },
  });

  if (!event) {
    throw new Response("Unauthorized", { status: 404 });
  }

  const tournament = await prisma.tournaments.create({
    data: {
      userId,
      name: `${event.name} | Tournament`,
    },
  });

  return redirect(`/tournaments/${tournament.id}?eventId=${event.id}`);
};
