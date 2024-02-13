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

  const battles = await prisma.battles.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      driverLeft: true,
      driverRight: true,
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
    const [winner, loser] =
      battle.winnerId === battle.driverLeftId
        ? [battle.driverLeft, battle.driverRight]
        : [battle.driverRight, battle.driverLeft];

    if (winner && loser) {
      driverElos[winner.id] = driverElos?.[winner.id] ?? {};
      driverElos[loser.id] = driverElos?.[loser.id] ?? {};

      const winnerElo = calculateElo(
        driverElos[winner.id].elo ?? 1000,
        driverElos[loser.id].elo ?? 1000,
        K,
        true
      );

      const loserElo = calculateElo(
        driverElos[loser.id].elo ?? 1000,
        driverElos[winner.id].elo ?? 1000,
        K,
        false
      );

      driverElos[winner.id].elo = winnerElo;
      driverElos[loser.id].elo = loserElo;

      driverElos[winner.id].breakdown = [
        ...(driverElos[winner.id].breakdown ?? []),
        {
          battle: battle,
          points: winnerElo,
        },
      ];

      driverElos[loser.id].breakdown = [
        ...(driverElos[loser.id].breakdown ?? []),
        {
          battle: battle,
          points: loserElo,
        },
      ];
    }
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
      return {
        id,
        points: driverElos[id].elo,
        name: allDrivers.find((driver) => driver.id === id)?.name,
        breakdown: driverElos[id].breakdown,
      };
    })
    .sort((a, b) => {
      //@ts-ignore
      return b.points - a.points;
    });

  return drivers;
};
