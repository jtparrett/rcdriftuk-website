import { TicketStatus } from "~/utils/enums";

import { prisma } from "./prisma.server";
import { startOfDay } from "date-fns";

export type GetEvent = Awaited<ReturnType<typeof getEvent>>;

export const getEvent = async (id: string, userId?: string) => {
  return prisma.events.findFirst({
    where: {
      id,
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      ticketCapacity: true,
      cover: true,
      name: true,
      link: true,
      description: true,
      ticketTypes: {
        select: {
          id: true,
          name: true,
          price: true,
          releaseDate: true,
          allowedRanks: true,
        },
        orderBy: { releaseDate: "asc" },
      },
      _count: {
        select: {
          responses: true,
          EventTickets: {
            where: {
              status: {
                notIn: [TicketStatus.REFUNDED],
              },
            },
          },
        },
      },
      responses: {
        take: 8,
        orderBy: {
          id: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
        },
      },
      eventTrack: {
        include: {
          Owners: {
            ...(userId
              ? {
                  where: {
                    userId,
                  },
                }
              : {
                  take: 0,
                }),
          },
          _count: {
            select: {
              events: {
                where: {
                  endDate: {
                    lte: startOfDay(new Date()),
                  },
                },
              },
            },
          },
        },
      },
    },
  });
};
