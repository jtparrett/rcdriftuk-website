import { prisma } from "~/utils/prisma.server";

const run = async () => {
  const battles = await prisma.tournamentBattles.findMany({
    where: {
      tournamentId: "4b47a904-bd88-4d37-b3f7-c6093e8cbb26",
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
        ? battle.driverLeft.user.driverId
        : battle.driverRight.user.driverId,
      loserId: leftWinner
        ? battle.driverRight.user.driverId
        : battle.driverLeft.user.driverId,
      tournament: "2025-BBRC",
    };
  });

  await prisma.driverRatingBattles.createMany({
    data: ratingBattles,
  });

  console.log("total battles: " + battles.length);
};

run();
