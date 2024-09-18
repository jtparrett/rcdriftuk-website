import { prisma } from "./prisma.server";

export const getTournament = (id: string) => {
  return prisma.tournaments.findFirst({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      format: true,
      qualifyingLaps: true,
      state: true,
      nextQualifyingLap: {
        include: {
          scores: true,
        },
      },
      drivers: {
        select: {
          id: true,
          name: true,
        },
      },
      judges: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export type GetTournament = Awaited<ReturnType<typeof getTournament>>;
