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
      userId: true,
      liveUrl: true,
      scoreFormula: true,
      bracketSize: true,
      enableProtests: true,
      qualifyingOrder: true,
      ratingRequested: true,
      rated: true,
      region: true,
      driverNumbers: true,
      enableQualifying: true,
      enableBattles: true,
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
          points: true,
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
