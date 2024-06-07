import { prisma } from "./prisma.server";

export const getTournament = (id: string) => {
  return prisma.tournaments.findFirst({
    where: {
      id,
    },
    select: {
      id: true,
      format: true,
      qualifyingLaps: true,
      nextQualifyingLap: {
        select: {
          driver: {
            select: {
              name: true,
              laps: {
                orderBy: {
                  id: "asc",
                },
                select: {
                  id: true,
                  scores: {
                    select: {
                      score: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      state: true,
      event: {
        select: {
          name: true,
        },
      },
      drivers: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export type GetTournament = Awaited<ReturnType<typeof getTournament>>;
