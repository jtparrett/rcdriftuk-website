import {
  BattlesBracket,
  TournamentsFormat,
  TournamentsState,
} from "@prisma/client";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { sortByInnerOuter } from "~/utils/innerOuterSorting";
import { prisma } from "~/utils/prisma.server";
import { sumScores } from "~/utils/sumScores";
import { pow2Floor } from "~/utils/tournament";

// true = every driver in the comp will compete in battles
// the top drivers will get a bye-run
const ADD_BYES = false;

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
    include: {
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

  if (ADD_BYES) {
    const totalDriversWithBuys = pow2Floor(tournament.drivers.length) * 2;
    const totalBuysToCreate = totalDriversWithBuys - tournament.drivers.length;

    // Create bye tournament drivers
    const buyDrivers = await prisma.tournamentDrivers.createManyAndReturn({
      data: Array.from(new Array(totalBuysToCreate)).map(() => {
        return {
          isBye: true,
          tournamentId: tournament.id,
          name: "BYE",
        };
      }),
    });

    // Create laps for buy drivers
    await prisma.$transaction(
      buyDrivers.map((driver) => {
        return prisma.laps.createMany({
          data: Array.from(new Array(tournament.qualifyingLaps)).map(() => ({
            tournamentDriverId: driver.id,
          })),
        });
      })
    );
  }

  const totalDrivers = pow2Floor(tournament.drivers.length);

  const sortedDrivers = tournament.drivers
    .map((driver) => {
      const lapScores = driver.laps.map((lap) =>
        sumScores(lap.scores, tournament._count.judges)
      );

      return {
        lapScores,
        id: driver.id,
      };
    })
    .sort((a, b) => {
      const [bestA = -1, secondA = -1, thirdA = -1] = [...a.lapScores].sort(
        (lapA, lapB) => lapB - lapA
      );
      const [bestB = -1, secondB = -1, thirdB = -1] = [...b.lapScores].sort(
        (lapA, lapB) => lapB - lapA
      );

      return bestB - bestA || secondB - secondA || thirdB - thirdA;
    });

  // Set qualifying positions
  await prisma.$transaction(
    sortedDrivers.map((driver, i) => {
      return prisma.tournamentDrivers.update({
        where: {
          id: driver.id,
        },
        data: {
          qualifyingPosition: i + 1,
        },
      });
    })
  );

  // Pairs top and bottom qualifiers into battles
  const initialBattleDrivers = sortByInnerOuter(
    Array.from(new Array(totalDrivers / 2)).map((_, i) => {
      const leftDriver = sortedDrivers[totalDrivers - i - 1];
      const rightDriver = sortedDrivers[i];

      return {
        driverLeftId: leftDriver.id,
        driverRightId: rightDriver.id,
      };
    })
  );

  const upperBracket = Array.from(new Array(totalDrivers - 1)).map((_, i) => {
    let round = Math.ceil(
      Math.log2(totalDrivers) - Math.log2(totalDrivers - (i + 1))
    );

    return {
      tournamentId: tournament.id,
      round: round === Infinity ? totalDrivers : round,
      bracket: BattlesBracket.UPPER,
    };
  });

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
                multiplier
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

  // Get initial battles
  const initialBattles = await prisma.tournamentBattles.findMany({
    where: {
      tournamentId: tournament.id,
      round: 1,
      bracket: BattlesBracket.UPPER,
    },
  });

  // Assign initial battle drivers to battles
  await prisma.$transaction(
    initialBattles.map((battle, i) => {
      const drivers = initialBattleDrivers[i];

      return prisma.tournamentBattles.update({
        where: {
          id: battle.id,
        },
        data: {
          driverLeftId: drivers.driverLeftId,
          driverRightId: drivers.driverRightId,
        },
      });
    })
  );

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
        bracket: "asc",
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

  return redirect(`/tournaments/${id}`);
};