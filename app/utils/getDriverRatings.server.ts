import { Regions } from "~/utils/enums";
import { prisma } from "./prisma.server";
import { adjustDriverElo } from "./adjustDriverElo.server";

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
      lastBattleDate: true,
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

  return users
    .map((user) => ({
      ...user,
      elo: adjustDriverElo(user.elo, user.lastBattleDate),
      elo_UK: adjustDriverElo(user.elo_UK, user.lastBattleDate),
      elo_EU: adjustDriverElo(user.elo_EU, user.lastBattleDate),
      elo_NA: adjustDriverElo(user.elo_NA, user.lastBattleDate),
      elo_APAC: adjustDriverElo(user.elo_APAC, user.lastBattleDate),
      elo_LATAM: adjustDriverElo(user.elo_LATAM, user.lastBattleDate),
      elo_MEA: adjustDriverElo(user.elo_MEA, user.lastBattleDate),
    }))
    .sort((a, b) => b.elo - a.elo);
};
