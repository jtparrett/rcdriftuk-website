import type { Tournaments } from "@prisma/client";
import {
  BattlesBracket,
  QualifyingProcedure,
  TournamentsFormat,
  TournamentsState,
} from "~/utils/enums";
import invariant from "~/utils/invariant";
import { sortByInnerOuter } from "~/utils/innerOuterSorting";
import { prisma } from "~/utils/prisma.server";
import { sumScores } from "~/utils/sumScores";
import { pow2Ceil, pow2Floor } from "~/utils/powFns";
import { autoAdvanceByeRuns } from "~/utils/autoAdvanceByeRuns.server";
import { getQualifyingWaveSize } from "~/utils/tournament";

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
    data: Array.from(new Array(tournament.qualifyingLaps)).map((_, i) => ({
      tournamentDriverId: byeTounamentDirver.id,
      round: i + 1,
    })),
  });

  return byeTounamentDirver;
};

// Only run this if you're sure all laps have been judged
export const tournamentEndQualifying = async (id: string) => {
  const tournament = await prisma.tournaments.update({
    where: {
      id,
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
      qualifyingProcedure: true,
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
    ? pow2Ceil(tournament.drivers.length) - tournament.drivers.length
    : 0;

  const driversWithScores = [
    ...tournament.drivers,
    ...Array.from(new Array(totalBuysToCreate)).map(() => ({
      id: byeTounamentDriver.id,
      laps: [],
    })),
  ].map((driver) => {
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
      lapScores.every((score) => score === 0) &&
      tournament.format !== TournamentsFormat.BATTLE_TREE
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
  });

  let sortedDrivers: { id: number; lapScores: number[] }[];

  if (tournament.qualifyingProcedure === QualifyingProcedure.WAVES) {
    // Waves procedure: qualify drivers in waves per round
    sortedDrivers = [];

    // Process each round in order
    for (let round = 1; round <= tournament.qualifyingLaps; round++) {
      // Get drivers sorted by their performance in this specific round
      const roundDrivers = driversWithScores
        .filter((driver) => driver.lapScores[round - 1] !== undefined)
        .sort(
          (a, b) =>
            b.lapScores[round - 1] - a.lapScores[round - 1] || a.id - b.id,
        );

      // Calculate wave size for this round
      const waveSize = getQualifyingWaveSize(tournament.qualifyingLaps, round);
      const offset =
        tournament.format === TournamentsFormat.WILDCARD &&
        round === tournament.qualifyingLaps
          ? -1
          : 0;
      const qualifyingCutOff =
        pow2Floor(tournament.drivers.length) * waveSize + offset;

      // Take the top drivers from this round that haven't already qualified
      const newQualifiers = roundDrivers.slice(0, qualifyingCutOff);

      sortedDrivers.push(...newQualifiers);
    }
  } else {
    // Best procedure: sort by best lap score across all rounds
    sortedDrivers = driversWithScores.sort((a, b) => {
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
  }

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

  const initialBattles = await prisma.tournamentBattles.findMany({
    where: {
      tournamentId: id,
      round: 1,
      bracket: BattlesBracket.UPPER,
    },
    orderBy: {
      id: "asc",
    },
  });

  const totalDriversWithBuys = pow2Floor(sortedDrivers.length);
  const initialBattleDrivers = sortByInnerOuter(
    Array.from(new Array(totalDriversWithBuys / 2)).map((_, i) => {
      let { id: driverLeftId } = sortedDrivers[totalDriversWithBuys - i - 1];
      let { id: driverRightId } = sortedDrivers[i];

      return {
        driverLeftId,
        driverRightId,
      };
    }),
  );

  await prisma.$transaction(
    initialBattles.map((battle, i) => {
      return prisma.tournamentBattles.update({
        where: {
          id: battle.id,
        },
        data: {
          driverLeftId: initialBattleDrivers[i].driverLeftId,
          driverRightId: initialBattleDrivers[i].driverRightId,
        },
      });
    }),
  );

  // After setting up battles, check if the first battle is a bye run and auto-advance if needed
  await autoAdvanceByeRuns(id);
};
