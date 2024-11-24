import type { Drivers } from "@prisma/client";
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
      winner: {
        select: {
          name: true,
          team: true,
        },
      },
      loser: {
        select: {
          name: true,
          team: true,
        },
      },
    },
  });

  const driverElos: Record<
    string,
    {
      driver: Drivers;
      currentElo: number;
      history: {
        battle: (typeof battles)[number];
        elo: number; // Drivers boints after battle
        opponentElo: number; // Opponents points after battle
        startingElo: number;
        startingOpponentElo: number;
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
    const loserStartingElo =
      loser.name === "BYE" ? 1000 : driverElos[loserId].currentElo ?? 1000;

    const winnersK =
      (driverElos[winnerId]?.history?.length ?? 0) <= 5 ? 32 : 64;
    const losersK = (driverElos[loserId]?.history?.length ?? 0) <= 5 ? 32 : 64;

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
      },
    ];
  }

  const drivers = Object.entries(driverElos)
    .map(([id, item]) => {
      return {
        id,
        currentElo: item.currentElo,
        name: item.driver.name,
        team: item.driver.team,
        history: item.history,
      };
    })
    .sort((a, b) => {
      return b.currentElo - a.currentElo;
    });

  return drivers;
};
