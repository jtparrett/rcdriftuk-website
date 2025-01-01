import { TournamentsState } from "@prisma/client";
import { prisma } from "./prisma.server";

export const getTournament = (id: string, userId: string | null) => {
  return prisma.tournaments.findFirst({
    where: {
      id,
      OR: [
        {
          userId,
        },
        {
          state: {
            notIn: [TournamentsState.START],
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      format: true,
      qualifyingLaps: true,
      state: true,
      userId: true,
      nextQualifyingLap: {
        include: {
          scores: true,
        },
      },
      nextBattle: {
        select: {
          BattleVotes: {
            distinct: ["judgeId"],
          },
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
