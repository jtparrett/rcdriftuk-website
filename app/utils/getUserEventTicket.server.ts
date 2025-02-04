import { prisma } from "~/utils/prisma.server";

export type GetUserEventTicket = Awaited<ReturnType<typeof getUserEventTicket>>;

export const getUserEventTicket = async (eventId: string, userId: string) => {
  return prisma.eventTickets.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId,
      },
    },
    select: {
      id: true,
      status: true,
      sessionId: true,
      event: {
        select: {
          id: true,
          name: true,
          description: true,
          cover: true,
          startDate: true,
          endDate: true,
          eventTrack: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
};
