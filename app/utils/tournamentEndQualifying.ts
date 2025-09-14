import type { Tournaments } from "@prisma/client";
import {
  BattlesBracket,
  TournamentsFormat,
  TournamentsState,
} from "~/utils/enums";
import invariant from "~/utils/invariant";
import { sortByInnerOuter } from "~/utils/innerOuterSorting";
import { prisma } from "~/utils/prisma.server";
import { sumScores } from "~/utils/sumScores";
import { pow2Floor } from "~/utils/tournament.server";
import { autoAdvanceByeRuns } from "~/utils/autoAdvanceByeRuns";

// Helper function to round up to next power of 2, or return same if already power of 2
const nextPowerOf2OrSame = (n: number): number => {
  if (n <= 0) return 1;
  if (pow2Floor(n) === n) return n; // Already a power of 2
  return pow2Floor(n * 2); // Same logic as pow2Ceil
};

const addByeDriverToTournament = async (
  tournament: Pick<Tournaments, "id" | "qualifyingLaps">,
) => {
  const byeTounamentDirver = await prisma.tournamentDrivers.create({
    data: {
      isBye: true,
      tournamentId: tournament.id,
      driverId: 0,
    },
  });

  await prisma.laps.createMany({
    data: Array.from(new Array(tournament.qualifyingLaps)).map(() => ({
      tournamentDriverId: byeTounamentDirver.id,
    })),
  });

  return byeTounamentDirver;
};

const setupRegularBattles = async (
  drivers: { id: number; lapScores: number[] }[],
  tournament: Pick<Tournaments, "id" | "fullInclusion" | "format">,
) => {
  // This is the total number of qualified drivers
  const totalDriversWithBuys = pow2Floor(drivers.length);

  // Pairs top and bottom qualifiers into battles
  const initialBattleDrivers = sortByInnerOuter(
    Array.from(new Array(totalDriversWithBuys / 2)).map((_, i) => {
      let { id: driverLeftId } = drivers[totalDriversWithBuys - i - 1];
      let { id: driverRightId } = drivers[i];

      return {
        driverLeftId,
        driverRightId,
      };
    }),
  );

  const upperBracket = Array.from(new Array(totalDriversWithBuys - 1)).map(
    (_, i) => {
      let round = Math.ceil(
        Math.log2(totalDriversWithBuys) -
          Math.log2(totalDriversWithBuys - (i + 1)),
      );

      const drivers = initialBattleDrivers[i] ?? {};

      return {
        tournamentId: tournament.id,
        round: round === Infinity ? totalDriversWithBuys : round,
        bracket: BattlesBracket.UPPER,
        driverLeftId: drivers.driverLeftId ?? null,
        driverRightId: drivers.driverRightId ?? null,
      };
    },
  );

  const rounds = [...new Set(upperBracket.map(({ round }) => round))];

  const data = [
    ...upperBracket,

    // Add lower bracket if DOUBLE_ELIMINATION
    ...(tournament.format === TournamentsFormat.DOUBLE_ELIMINATION
      ? rounds
          .flatMap((round) => {
            const multiplier = round <= 1 ? 0.5 : 1.5;
            const totalBattlesForRound = Math.ceil(
              upperBracket.filter((battle) => battle.round === round).length *
                multiplier,
            );

            return Array.from(new Array(totalBattlesForRound)).map(() => {
              return {
                tournamentId: tournament.id,
                round,
                bracket: BattlesBracket.LOWER,
              };
            });
          })
          .slice(0, -1) // We delete the 1 extra lower round and make our own final instead below
      : []),

    // FINAL BATTLE
    {
      tournamentId: tournament.id,
      round: 1000,
      bracket: BattlesBracket.UPPER,
    },
  ];

  await prisma.tournamentBattles.createMany({
    data,
  });
};

const setupWildcardBattles = async (
  drivers: { id: number; lapScores: number[] }[],
  tournament: Pick<Tournaments, "id" | "fullInclusion">,
) => {
  // This is the total number of qualified drivers
  const totalDriversWithBuys = pow2Floor(drivers.length);

  const totalBattlesPerBracket = totalDriversWithBuys / 2;

  const lowerBracket = Array.from(new Array(totalBattlesPerBracket - 1)).map(
    (_, i) => {
      let round = Math.ceil(
        Math.log2(totalBattlesPerBracket) -
          Math.log2(totalBattlesPerBracket - (i + 1)),
      );

      return {
        tournamentId: tournament.id,
        round: round === Infinity ? totalBattlesPerBracket : round,
        bracket: BattlesBracket.LOWER,
      };
    },
  );

  const upperBracket = Array.from(new Array(totalBattlesPerBracket - 1)).map(
    (_, i) => {
      let round = Math.ceil(
        Math.log2(totalBattlesPerBracket) -
          Math.log2(totalBattlesPerBracket - (i + 1)),
      );

      return {
        tournamentId: tournament.id,
        round: round === Infinity ? totalBattlesPerBracket : round,
        bracket: BattlesBracket.UPPER,
      };
    },
  );

  await prisma.tournamentBattles.createMany({
    data: [
      ...lowerBracket,
      ...upperBracket,
      // FINAL BATTLE
      {
        tournamentId: tournament.id,
        round: 1000,
        bracket: BattlesBracket.UPPER,
      },
    ],
  });

  const [initialLowerBattles, initialUpperBattles] = await prisma.$transaction([
    prisma.tournamentBattles.findMany({
      where: {
        tournamentId: tournament.id,
        round: 1,
        bracket: BattlesBracket.LOWER,
      },
    }),
    prisma.tournamentBattles.findMany({
      where: {
        tournamentId: tournament.id,
        round: 1,
        bracket: BattlesBracket.UPPER,
      },
    }),
  ]);

  const totalDriversPerBracket = totalDriversWithBuys / 2;
  // Minus 1 to allow the lower bracket winner to enter the upper bracket
  const lowerDrivers = drivers.slice(totalDriversPerBracket - 1);
  const upperDrivers = drivers.slice(0, totalDriversPerBracket - 1);

  // Pairs top and bottom qualifiers into battles
  const initialLowerBattleDrivers = sortByInnerOuter(
    Array.from(new Array(totalDriversPerBracket / 2)).map((_, i) => {
      let { id: driverLeftId } = lowerDrivers[totalDriversPerBracket - i - 1];
      let { id: driverRightId } = lowerDrivers[i];

      return {
        driverLeftId,
        driverRightId,
      };
    }),
  );

  // The last driver in the last battle will be null
  // leaving space for the lower bracket winner
  const initialUpperBattleDrivers = sortByInnerOuter(
    Array.from(new Array(totalDriversPerBracket / 2)).map((_, i) => {
      let { id: driverLeftId } = upperDrivers[
        totalDriversPerBracket - i - 1
      ] ?? { id: null };
      let { id: driverRightId } = upperDrivers[i];

      return {
        driverLeftId,
        driverRightId,
      };
    }),
  );

  // Assign initial battle drivers to battles
  await prisma.$transaction([
    ...initialLowerBattles.map((battle, i) => {
      const { driverLeftId, driverRightId } = initialLowerBattleDrivers[i];

      return prisma.tournamentBattles.update({
        where: {
          id: battle.id,
        },
        data: {
          driverLeftId,
          driverRightId,
        },
      });
    }),
    ...initialUpperBattles.map((battle, i) => {
      const { driverLeftId, driverRightId } = initialUpperBattleDrivers[i];

      return prisma.tournamentBattles.update({
        where: {
          id: battle.id,
        },
        data: {
          driverLeftId,
          driverRightId,
        },
      });
    }),
  ]);
};

// Only run this if you're sure all laps have been judged
export const tournamentEndQualifying = async (id: string) => {
  const tournament = await prisma.tournaments.update({
    where: {
      id,
      state: TournamentsState.QUALIFYING,
    },
    data: {
      state: TournamentsState.BATTLES,
      nextQualifyingLapId: null,
    },
    select: {
      id: true,
      scoreFormula: true,
      fullInclusion: true,
      format: true,
      qualifyingLaps: true,
      _count: {
        select: {
          judges: true,
        },
      },
      drivers: {
        orderBy: {
          id: "asc",
        },
        include: {
          laps: {
            include: {
              scores: true,
            },
          },
        },
      },
    },
  });

  invariant(tournament, "Missing tournament");

  const byeTounamentDriver = await addByeDriverToTournament(tournament);

  const totalBuysToCreate = tournament.fullInclusion
    ? nextPowerOf2OrSame(tournament.drivers.length) - tournament.drivers.length
    : 0;

  const sortedDrivers = [
    ...tournament.drivers,
    ...Array.from(new Array(totalBuysToCreate)).map(() => ({
      id: byeTounamentDriver.id,
      laps: [],
    })),
  ]
    .map((driver) => {
      const lapScores = driver.laps.map((lap) =>
        sumScores(
          lap.scores,
          tournament._count.judges,
          tournament.scoreFormula,
          lap.penalty,
        ),
      );

      // If the driver has no scores, convert them into a BYE run
      // only if the tournament is not full inclusion
      if (
        !tournament.fullInclusion &&
        lapScores.every((score) => score === 0)
      ) {
        return {
          lapScores: [],
          id: byeTounamentDriver.id,
        };
      }

      return {
        lapScores,
        id: driver.id,
      };
    })
    .sort((a, b) => {
      const [bestA = -1, secondA = -1, thirdA = -1] = [...a.lapScores].sort(
        (lapA, lapB) => lapB - lapA,
      );
      const [bestB = -1, secondB = -1, thirdB = -1] = [...b.lapScores].sort(
        (lapA, lapB) => lapB - lapA,
      );

      return (
        bestB - bestA || secondB - secondA || thirdB - thirdA || a.id - b.id
      );
    });

  // Set qualifying positions (exclude bye driver)
  await prisma.$transaction(
    sortedDrivers
      .filter((driver) => driver.id !== byeTounamentDriver.id)
      .map((driver, i) => {
        return prisma.tournamentDrivers.update({
          where: {
            id: driver.id,
          },
          data: {
            qualifyingPosition: i + 1,
          },
        });
      }),
  );

  if (tournament.format === TournamentsFormat.WILDCARD) {
    await setupWildcardBattles(sortedDrivers, tournament);
  } else {
    await setupRegularBattles(sortedDrivers, tournament);
  }

  // Get next battle
  const nextBattle = await prisma.tournamentBattles.findFirst({
    where: {
      tournamentId: tournament.id,
      winnerId: null,
    },
    orderBy: [
      {
        round: "asc",
      },
      {
        bracket:
          tournament.format === TournamentsFormat.WILDCARD ? "desc" : "asc",
      },
      {
        id: "asc",
      },
    ],
    select: {
      id: true,
    },
  });

  // Set next battle
  await prisma.tournaments.update({
    where: {
      id: tournament.id,
    },
    data: {
      nextBattleId: nextBattle?.id,
    },
  });

  // After setting up battles, check if the first battle is a bye run and auto-advance if needed
  await autoAdvanceByeRuns(id);
};
