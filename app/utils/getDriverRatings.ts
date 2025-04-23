import type { Users } from "@prisma/client";
import { prisma } from "./prisma.server";

function calculateElos(
  ratingPlayer: number,
  ratingOpponent: number,
  winnersK: number,
  losersK: number
) {
  const expectedScorePlayer =
    1 / (1 + Math.pow(10, (ratingOpponent - ratingPlayer) / 400));

  const expectedScoreOpponent = 1 - expectedScorePlayer;

  const newRatingPlayer = ratingPlayer + winnersK * (1 - expectedScorePlayer);
  const newRatingOpponent =
    ratingOpponent + losersK * (0 - expectedScoreOpponent);

  return { newRatingPlayer, newRatingOpponent };
}

export const getDriverRatings = async () => {
  const battles = await prisma.driverRatingBattles.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      winnerId: true,
      loserId: true,
      tournament: true,
      createdAt: true,
      winner: {
        select: {
          driverId: true,
          firstName: true,
          lastName: true,
          team: true,
          image: true,
        },
      },
      loser: {
        select: {
          driverId: true,
          firstName: true,
          lastName: true,
          team: true,
          image: true,
        },
      },
    },
  });

  const driverElos: Record<
    string,
    {
      driver: Users;
      currentElo: number;
      history: {
        battle: Omit<(typeof battles)[number], "createdAt">;
        elo: number; // Drivers boints after battle
        opponentElo: number; // Opponents points after battle
        startingElo: number;
        startingOpponentElo: number;
        totalBattles: number;
        totalOpponentBattles: number;
      }[];
    }
  > = {};

  for (const battle of battles) {
    const { winnerId, loserId, winner, loser } = battle;

    driverElos[winnerId] = driverElos?.[winnerId] ?? {
      driver: winner,
    };
    driverElos[loserId] = driverElos?.[loserId] ?? {
      driver: loser,
    };

    const winnerStartingElo = driverElos[winnerId].currentElo ?? 1000;

    // Driver 0 is the "BYE" driver
    const loserStartingElo =
      loser.driverId === 0 ? 1000 : driverElos[loserId].currentElo ?? 1000;

    const winnerTotalBattles = driverElos[winnerId]?.history?.length ?? 0;
    const loserTotalBattles = driverElos[loserId]?.history?.length ?? 0;

    let winnersK = winnerTotalBattles >= 5 ? 32 : 64;
    let losersK = 32;

    if (battle.tournament.includes("FINAL")) {
      winnersK *= 2;
    }

    const { newRatingPlayer: winnerElo, newRatingOpponent: loserElo } =
      calculateElos(winnerStartingElo, loserStartingElo, winnersK, losersK);

    driverElos[winnerId].currentElo = winnerElo;
    driverElos[loserId].currentElo = loserElo;

    driverElos[winnerId].history = [
      ...(driverElos[winnerId].history ?? []),
      {
        battle: battle,
        elo: winnerElo,
        opponentElo: loserElo,
        startingElo: winnerStartingElo,
        startingOpponentElo: loserStartingElo,
        totalBattles: winnerTotalBattles,
        totalOpponentBattles: loserTotalBattles,
      },
    ];

    driverElos[loserId].history = [
      ...(driverElos[loserId].history ?? []),
      {
        battle: battle,
        elo: loserElo,
        opponentElo: winnerElo,
        startingElo: loserStartingElo,
        startingOpponentElo: winnerStartingElo,
        totalBattles: loserTotalBattles,
        totalOpponentBattles: winnerTotalBattles,
      },
    ];
  }

  const drivers = Object.entries(driverElos)
    .map(([id, item]) => {
      return {
        id,
        driverId: item.driver.driverId,
        currentElo: item.currentElo,
        firstName: item.driver.firstName,
        lastName: item.driver.lastName,
        team: item.driver.team,
        history: item.history,
        image: item.driver.image,
      };
    })
    .sort((a, b) => {
      return b.currentElo - a.currentElo;
    });

  return drivers;
};
