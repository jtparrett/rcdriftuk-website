import { TicketStatus } from "@prisma/client";
import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { id } = args.params;
  const { userId } = await getAuth(args);

  const event = await prisma.events.findUnique({
    where: {
      id,
    },
    include: {
      eventTrack: true,
      EventTickets: {
        where: {
          status: TicketStatus.CONFIRMED,
        },
        include: {
          user: {
            select: {
              driverId: true,
            },
          },
        },
      },
    },
  });

  invariant(event, "Event not found");
  invariant(userId, "User not found");

  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  if (user?.trackId !== event.eventTrack?.id) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const tournament = await prisma.tournaments.create({
    data: {
      userId,
      name: `${event.name} Tournament`,
    },
  });

  await prisma.tournamentDrivers.createMany({
    data: event.EventTickets.map((ticket) => ({
      driverId: ticket.user?.driverId ?? 0,
      tournamentId: tournament.id,
    })),
    skipDuplicates: true,
  });

  return redirect(`/tournaments/${tournament.id}`);
};
