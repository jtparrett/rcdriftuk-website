import { Prisma } from "@prisma/client";
import { Regions } from "~/utils/enums";
import { prisma } from "./prisma.server";
import { adjustDriverElo } from "./adjustDriverElo.server";
import { getBestRegionalElo } from "./getBestRegionalElo";

const PENALTY_SQL = `
  CASE
    WHEN u."lastTournamentDate" IS NULL THEN 0
    WHEN EXTRACT(EPOCH FROM (NOW() - u."lastTournamentDate")) / (60 * 60 * 24 * 365.25) < 0.5 THEN 0
    ELSE FLOOR((EXTRACT(EPOCH FROM (NOW() - u."lastTournamentDate")) / (60 * 60 * 24 * 365.25) - 0.5) * -200)
  END`;

export const getDriverRatings = async (region: Regions, limit?: number) => {
  const sortExpr =
    region !== Regions.ALL
      ? Prisma.raw(`(u."elo_${region}" + ${PENALTY_SQL}) DESC`)
      : Prisma.raw(
          `(GREATEST(u."elo_UK", u."elo_EU", u."elo_NA", u."elo_ZA", u."elo_LA", u."elo_AP") + ${PENALTY_SQL}) DESC`,
        );

  const regionFilter =
    region !== Regions.ALL
      ? Prisma.sql`AND t."region" = ${region}::"Regions"`
      : Prisma.raw("");

  const limitClause =
    limit !== undefined ? Prisma.sql`LIMIT ${limit}` : Prisma.raw("");

  const sortedIds = await prisma.$queryRaw<Array<{ driverId: number }>>`
    SELECT u."driverId"
    FROM "Users" u
    WHERE u."driverId" != 0
      AND EXISTS (
        SELECT 1 FROM "TournamentDrivers" td
        JOIN "Tournaments" t ON td."tournamentId" = t."id"
        WHERE td."driverId" = u."driverId"
          AND t."rated" = true
          ${regionFilter}
      )
    ORDER BY ${sortExpr}
    ${limitClause}
  `;

  const driverIds = sortedIds.map((r) => r.driverId);
  if (driverIds.length === 0) {
    return [];
  }

  const users = await prisma.users.findMany({
    where: {
      driverId: { in: driverIds },
    },
    select: {
      id: true,
      lastTournamentDate: true,
      driverId: true,
      firstName: true,
      lastName: true,
      elo_UK: true,
      elo_EU: true,
      elo_NA: true,
      elo_ZA: true,
      elo_LA: true,
      elo_AP: true,
      image: true,
      team: true,
      ranked: true,
    },
  });

  const usersById = new Map(users.map((u) => [u.driverId, u]));

  return driverIds
    .map((id) => usersById.get(id)!)
    .map((user) => {
      const adjusted = {
        ...user,
        elo_UK: adjustDriverElo(user.elo_UK, user.lastTournamentDate),
        elo_EU: adjustDriverElo(user.elo_EU, user.lastTournamentDate),
        elo_NA: adjustDriverElo(user.elo_NA, user.lastTournamentDate),
        elo_ZA: adjustDriverElo(user.elo_ZA, user.lastTournamentDate),
        elo_LA: adjustDriverElo(user.elo_LA, user.lastTournamentDate),
        elo_AP: adjustDriverElo(user.elo_AP, user.lastTournamentDate),
      };
      const { bestElo, bestRegion } = getBestRegionalElo(adjusted);
      return { ...adjusted, bestElo, bestRegion };
    })
    .map((driver, rank) => ({
      ...driver,
      rank: rank + 1,
    }));
};
