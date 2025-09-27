import {
  QualifyingProcedure,
  TournamentsFormat,
  TournamentsState,
} from "@prisma/client";
import { prisma } from "./prisma.server";
import invariant from "./invariant";
import { QualifyingOrder } from "./enums";
import { sumScores } from "./sumScores";
import { getQualifyingWaveSize } from "./tournament";
import { pow2Floor } from "./powFns";

export const tournamentAdvanceQualifying = async (
  id: string,
  skipChecks?: boolean,
) => {
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      state: TournamentsState.QUALIFYING,
    },
    include: {
      judges: true,
      drivers: true,
      nextQualifyingLap: {
        include: {
          scores: true,
        },
      },
      _count: {
        select: {
          judges: true,
        },
      },
    },
  });

  invariant(tournament, "Tournament not found");

  invariant(
    skipChecks ||
      tournament?.judges.length ===
        tournament?.nextQualifyingLap?.scores.length,
    "Judging not complete for current lap",
  );

  let nextQualifyingLap = await prisma.laps.findFirst({
    where: {
      driver: {
        tournamentId: id,
      },
      scores: {
        none: {},
      },
    },
    orderBy:
      tournament.qualifyingOrder === QualifyingOrder.DRIVERS
        ? [
            {
              tournamentDriverId: "asc",
            },
            { id: "asc" },
          ]
        : [{ id: "asc" }],
  });

  if (
    !nextQualifyingLap &&
    tournament.qualifyingProcedure === QualifyingProcedure.WAVES &&
    tournament.nextQualifyingLap &&
    tournament.nextQualifyingLap.round < tournament.qualifyingLaps
  ) {
    const roundDrivers = await prisma.tournamentDrivers.findMany({
      where: {
        tournamentId: id,
        laps: {
          some: {
            round: tournament.nextQualifyingLap.round,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
      include: {
        laps: {
          take: 1,
          where: {
            round: tournament.nextQualifyingLap.round,
          },
          include: {
            scores: true,
          },
        },
      },
    });

    const sortedDrivers = roundDrivers.sort((a, b) => {
      const [aLap] = a.laps;
      const [bLap] = b.laps;

      const aScore = sumScores(
        aLap.scores,
        tournament._count.judges,
        tournament.scoreFormula,
        aLap.penalty,
      );

      const bScore = sumScores(
        bLap.scores,
        tournament._count.judges,
        tournament.scoreFormula,
        bLap.penalty,
      );

      return bScore - aScore || a.id - b.id;
    });

    const waveSize = getQualifyingWaveSize(
      tournament.qualifyingLaps,
      tournament.nextQualifyingLap.round,
    );
    const offset =
      tournament.format === TournamentsFormat.WILDCARD &&
      tournament.nextQualifyingLap.round === tournament.qualifyingLaps
        ? -1
        : 0;

    const remainingDrivers = [...sortedDrivers].slice(
      pow2Floor(tournament.drivers.length) * waveSize + offset,
    );

    const nextRound = tournament.nextQualifyingLap.round + 1;

    [nextQualifyingLap] = await prisma.laps.createManyAndReturn({
      data: remainingDrivers
        .sort((a, b) => a.id - b.id)
        .map((driver) => {
          return {
            tournamentDriverId: driver.id,
            round: nextRound,
          };
        }),
    });
  }

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      nextQualifyingLapId: nextQualifyingLap?.id ?? null,
    },
  });
};
