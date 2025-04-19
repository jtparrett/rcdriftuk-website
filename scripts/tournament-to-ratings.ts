import { prisma } from "~/utils/prisma.server";

const run = async () => {
  const battles = await prisma.tournamentBattles.findMany({
    where: {
      tournamentId: "bcb1a684-e0d4-4b88-9c44-1172572c27ae",
    },
    orderBy: {
      id: "asc",
    },
    include: {
      driverLeft: {
        include: {
          user: true,
        },
      },
      driverRight: {
        include: {
          user: true,
        },
      },
    },
  });

  const ratingBattles = battles.map((battle) => {
    const leftWinner = battle.winnerId === battle.driverLeftId;

    return {
      winnerId: leftWinner
        ? battle.driverLeft?.user.driverId ?? 0
        : battle.driverRight?.user.driverId ?? 0,
      loserId: leftWinner
        ? battle.driverRight?.user.driverId ?? 0
        : battle.driverLeft?.user.driverId ?? 0,
      tournament: "2025-SLDN",
    };
  });

  await prisma.driverRatingBattles.createMany({
    data: ratingBattles,
  });

  console.log("total battles: " + battles.length);
};

run();
