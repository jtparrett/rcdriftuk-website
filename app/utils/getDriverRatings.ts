import { Regions } from "~/utils/enums";
import { prisma } from "./prisma.server";

export const getDriverRatings = async (region: Regions, limit?: number) => {
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
    take: limit,
    select: {
      id: true,
      driverId: true,
      firstName: true,
      lastName: true,
      elo: true,
      elo_UK: true,
      elo_EU: true,
      elo_NA: true,
      elo_APAC: true,
      elo_LATAM: true,
      elo_MEA: true,
      image: true,
      team: true,
      totalBattles: true,
    },
  });

  return users;
};
