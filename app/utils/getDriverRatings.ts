import { Regions } from "@prisma/client";
import { prisma } from "./prisma.server";

export const getDriverRatings = async (region: Regions) => {
  const users = await prisma.users.findMany({
    where: {
      TournamentDrivers: {
        some: {
          tournament: {
            rated: true,
            ...(region !== Regions.ALL && { region }),
          },
        },
      },
    },
    orderBy: {
      elo: "desc",
    },
    select: {
      id: true,
      driverId: true,
      firstName: true,
      lastName: true,
      elo: true,
      image: true,
      team: true,
      TournamentDrivers: {
        select: {
          _count: {
            select: {
              leftBattles: true,
              rightBattles: true,
            },
          },
        },
      },
    },
  });

  return users.map((user) => {
    const totalBattles = user.TournamentDrivers.reduce(
      (acc, curr) => acc + curr._count.leftBattles + curr._count.rightBattles,
      0
    );

    return {
      ...user,
      totalBattles,
    };
  });
};
