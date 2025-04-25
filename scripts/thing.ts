import { TournamentsState } from "@prisma/client";
import { prisma } from "~/utils/prisma.server";

const run = async () => {
  const tournamentId = "35788ae3-9cd2-46e4-b295-1bb26cbeec25";
  const ratingsId = "2024-FINAL";

  const battles = await prisma.driverRatingBattles.findMany({
    where: {
      tournament: ratingsId,
    },
    orderBy: {
      id: "asc",
    },
  });

  const uniqueDriverIds = new Set([
    ...new Set(battles.map((battle) => battle.winnerId)),
    ...new Set(battles.map((battle) => battle.loserId)),
  ]);

  // Create tournament drivers
  await prisma.tournamentDrivers.createMany({
    data: Array.from(uniqueDriverIds).map((driverId) => ({
      tournamentId,
      driverId,
    })),
  });

  const tournamentDrivers = await prisma.tournamentDrivers.findMany({
    where: {
      tournamentId,
    },
  });

  // Create battles
  const battlesData = battles.map((battle, i) => {
    const totalBattles = battles.length;
    const round = Math.ceil(
      Math.log2(totalBattles) - Math.log2(totalBattles - (i + 1))
    );

    return {
      tournamentId,
      round: i === totalBattles - 1 ? 1000 : round, // Final battle is round 1000
      createdAt: battle.createdAt,
      driverLeftId: tournamentDrivers.find(
        (driver) => driver.driverId === battle.winnerId
      )?.id,
      driverRightId: tournamentDrivers.find(
        (driver) => driver.driverId === battle.loserId
      )?.id,
      winnerId: tournamentDrivers.find(
        (driver) => driver.driverId === battle.winnerId
      )?.id,
    };
  });

  const result = await prisma.tournamentBattles.createMany({
    data: battlesData,
  });

  console.log(result.count, "battles created");

  await prisma.tournaments.update({
    where: {
      id: tournamentId,
    },
    data: {
      state: TournamentsState.END,
    },
  });
};

run();
