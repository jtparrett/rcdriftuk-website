import { prisma } from "~/utils/prisma.server";
import { getAuth } from "~/utils/getAuth.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { TicketStatus } from "@prisma/client";
import { format } from "date-fns";

export const loader = async (args: LoaderFunctionArgs) => {
  const { id } = args.params;
  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const event = await prisma.events.findUnique({
    where: { id },
    include: {
      eventTrack: {
        include: {
          owners: {
            where: {
              id: userId,
            },
          },
        },
      },
      EventTickets: {
        orderBy: {
          createdAt: "desc",
        },
        where: {
          status: TicketStatus.CONFIRMED,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              driverId: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    throw new Response("Event not found", { status: 404 });
  }

  if (event.eventTrack?.owners.length === 0) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const csvRows = [
    [
      "Driver ID",
      "First Name",
      "Last Name",
      "Ticket Status",
      "Purchase Date",
    ].join(","),
    ...event.EventTickets.map((ticket) =>
      [
        ticket.user?.driverId ?? "",
        ticket.user?.firstName ?? "",
        ticket.user?.lastName ?? "",
        ticket.status,
        new Date(ticket.createdAt).toLocaleDateString(),
      ].join(",")
    ),
  ];

  const csv = csvRows.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${event.name}-tickets-${format(
        new Date(),
        "dd-MM-yyyy"
      )}.csv"`,
    },
  });
};
