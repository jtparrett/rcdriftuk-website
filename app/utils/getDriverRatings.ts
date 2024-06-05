import { prisma } from "./prisma.server";

function calculateElo(
  ratingPlayer: number,
  ratingOpponent: number,
  K: number,
  isPlayerWin: boolean
) {
  // Calculate expected score
  let expectedScorePlayer =
    1 / (1 + Math.pow(10, (ratingOpponent - ratingPlayer) / 400));

  // Calculate actual score
  let actualScorePlayer = isPlayerWin ? 1 : 0; // assuming only win/lose, no draw

  // Calculate new rating
  let newRatingPlayer =
    ratingPlayer + K * (actualScorePlayer - expectedScorePlayer);

  return newRatingPlayer;
}

export const getDriverRatings = async () => {
  let K = 64; // K-factor

  const battles = await prisma.driverRatingBattles.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      winner: true,
      loser: true,
    },
  });

  const driverElos: Record<
    string,
    {
      elo: number;
      breakdown: {
        battle: (typeof battles)[number];
        points: number;
      }[];
    }
  > = {};

  for (const battle of battles) {
    const { winnerId, loserId } = battle;

    driverElos[winnerId] = driverElos?.[winnerId] ?? {};
    driverElos[loserId] = driverElos?.[loserId] ?? {};

    const winnerElo = calculateElo(
      driverElos[winnerId].elo ?? 1000,
      driverElos[loserId].elo ?? 1000,
      K,
      true
    );

    const loserElo = calculateElo(
      driverElos[loserId].elo ?? 1000,
      driverElos[winnerId].elo ?? 1000,
      K,
      false
    );

    driverElos[winnerId].elo = winnerElo;
    driverElos[loserId].elo = loserElo;

    driverElos[winnerId].breakdown = [
      ...(driverElos[winnerId].breakdown ?? []),
      {
        battle: battle,
        points: winnerElo,
      },
    ];

    driverElos[loserId].breakdown = [
      ...(driverElos[loserId].breakdown ?? []),
      {
        battle: battle,
        points: loserElo,
      },
    ];
  }

  const allDrivers = await prisma.drivers.findMany({
    where: {
      id: {
        in: Object.keys(driverElos),
      },
    },
  });

  const drivers = Object.keys(driverElos)
    .map((id) => {
      const driverInfo = allDrivers.find((driver) => driver.id === id);
      return {
        id,
        points: driverElos[id].elo,
        name: driverInfo?.name,
        team: driverInfo?.team,
        breakdown: driverElos[id].breakdown,
      };
    })
    .sort((a, b) => {
      //@ts-ignore
      return b.points - a.points;
    });

  return drivers;
};
