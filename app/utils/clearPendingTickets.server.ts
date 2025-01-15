import { prisma } from "./prisma.server";
import { TicketStatus } from "@prisma/client";

export const clearPendingTickets = async (eventId: string) => {
  const fifteenMinutesAgo = new Date(Date.now() - 1000 * 60 * 15);

  await prisma.eventTickets.deleteMany({
    where: {
      eventId,
      status: TicketStatus.PENDING,
      createdAt: {
        lte: fifteenMinutesAgo,
      },
    },
  });
};
