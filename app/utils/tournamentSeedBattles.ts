import type { Tournaments } from "@prisma/client";
import { BattlesBracket, TournamentsState } from "~/utils/enums";
import invariant from "~/utils/invariant";
import { sortByInnerOuter } from "~/utils/innerOuterSorting";
import { prisma } from "~/utils/prisma.server";
import { sortByQualifyingScores } from "~/utils/sortByQualifyingScores";
import { sumScores } from "~/utils/sumScores";
import { autoAdvanceByeRuns } from "~/utils/autoAdvanceByeRuns.server";
import { setTournamentFinishingPositions } from "./setTournamentFinishingPositions";

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
export const tournamentSeedBattles = async (id: string) => {
  const tournament = await prisma.tournaments.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      scoreFormula: true,
      bracketSize: true,
      format: true,
      qualifyingLaps: true,
      enableBattles: true,
      enableQualifying: true,
      _count: {
        select: {
          judges: true,
        },
      },
      judges: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
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

  const judgeIds = tournament.judges.map((j) => j.id);

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      state: tournament.enableBattles
        ? TournamentsState.BATTLES
        : TournamentsState.END,
      nextQualifyingLapId: null,
    },
  });

  if (!tournament.enableBattles) {
    await setTournamentFinishingPositions(id);
    return;
  }

  const byeTounamentDriver = await addByeDriverToTournament(tournament);

  const totalBuysToCreate = Math.max(
    0,
    tournament.bracketSize - tournament.drivers.length,
  );

  const driversWithScores = [
    ...tournament.drivers,
    ...Array.from(new Array(totalBuysToCreate)).map((_, i) => ({
      id: byeTounamentDriver.id,
      laps: [],
      tournamentDriverNumber: tournament.drivers.length + i + 1,
    })),
  ].map((driver) => {
    const lapScores = driver.laps.map((lap) =>
      sumScores(
        lap.scores,
        tournament._count.judges,
        tournament.scoreFormula,
        lap.penalty,
        judgeIds,
      ),
    );

    // If the driver has no scores, convert them into a BYE run
    if (
      lapScores.every((score) => score === 0) &&
      tournament.enableQualifying
    ) {
      return {
        lapScores: [],
        id: byeTounamentDriver.id,
        tournamentDriverNumber: byeTounamentDriver.tournamentDriverNumber,
      };
    }

    return {
      lapScores,
      id: driver.id,
      tournamentDriverNumber: driver.tournamentDriverNumber,
    };
  });

  let sortedDrivers = sortByQualifyingScores(
    driversWithScores,
    (d) => d.tournamentDriverNumber,
  );

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

  const initialBattleDrivers = sortByInnerOuter(
    Array.from(new Array(tournament.bracketSize / 2)).map((_, i) => {
      let { id: driverLeftId } = sortedDrivers[tournament.bracketSize - i - 1];
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
