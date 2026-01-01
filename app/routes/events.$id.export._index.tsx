import { prisma } from "~/utils/prisma.server";
import { getAuth } from "~/utils/getAuth.server";
import type { LoaderFunctionArgs } from "react-router";
import { TicketStatus } from "~/utils/enums";
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
          Owners: {
            where: {
              userId,
            },
          },
        },
      },
      EventTickets: {
        orderBy: {
          updatedAt: "desc",
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

  if ((event.eventTrack?.Owners.length ?? 0) <= 0) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const csvRows = [
    ["Driver ID", "First Name", "Last Name", "Purchase Date"].join(","),
    ...event.EventTickets.map((ticket) =>
      [
        String(ticket.user?.driverId ?? 0),
        ticket.user?.firstName ?? "",
        ticket.user?.lastName ?? "",
        new Date(ticket.updatedAt).toLocaleDateString(),
      ].join(","),
    ),
  ];

  const csv = csvRows.join("\n");

  // Sanitize filename to ensure only ASCII characters (HTTP headers requirement)
  const sanitizedEventName = event.name
    .replace(/[–—]/g, "-") // Replace en dash and em dash with regular hyphen
    .replace(/[^\x00-\x7F]/g, "") // Remove any remaining non-ASCII characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w-]/g, ""); // Keep only word characters and hyphens

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${sanitizedEventName}-tickets-${format(
        new Date(),
        "dd-MM-yyyy",
      )}.csv"`,
    },
  });
};
