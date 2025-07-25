import { TournamentsState } from "~/utils/enums";
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
      liveUrl: true,
      nextQualifyingLap: {
        include: {
          scores: true,
        },
      },
      nextBattle: {
        select: {
          id: true,
          driverLeftId: true,
          driverRightId: true,
          BattleVotes: {
            distinct: ["judgeId"],
          },
          driverLeft: {
            select: {
              driverId: true,
            },
          },
          driverRight: {
            select: {
              driverId: true,
            },
          },
          BattleProtests: {
            select: {
              id: true,
              resolved: true,
            },
          },
        },
      },
      drivers: {
        select: {
          id: true,
          driverId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      judges: {
        where: {
          user: {
            id: {
              not: null,
            },
          },
        },
        select: {
          id: true,
          driverId: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });
};

export type GetTournament = Awaited<ReturnType<typeof getTournament>>;
