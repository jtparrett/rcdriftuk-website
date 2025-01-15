import { prisma } from "./prisma.server";
import { TicketStatus } from "@prisma/client";

export const clearPendingTickets = async (eventId: string) => {
  const tenMinutesAgo = new Date(Date.now() - 1000 * 60 * 10);

  await prisma.eventTickets.updateMany({
    where: {
      eventId,
      status: TicketStatus.PENDING,
      createdAt: {
        lte: tenMinutesAgo,
      },
    },
    data: {
      status: TicketStatus.CANCELLED,
    },
  });
};
