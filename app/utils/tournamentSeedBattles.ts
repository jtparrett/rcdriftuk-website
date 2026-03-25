import type { Tournaments } from "@prisma/client";
import { BattlesBracket, TournamentsState } from "~/utils/enums";
import invariant from "~/utils/invariant";
import { sortByInnerOuter } from "~/utils/innerOuterSorting";
import { prisma } from "~/utils/prisma.server";
import { sortByQualifyingScores } from "~/utils/sortByQualifyingScores";
import { sumScores } from "~/utils/sumScores";
import { autoAdvanceByeRuns } from "~/utils/autoAdvanceByeRuns.server";
import { allocateDriverIdsToStages } from "./allocateTournamentStageDrivers";
import { toStageRound } from "./tournamentStageRounds";

const addByeDriverToTournament = async (
  tournament: Pick<Tournaments, "id" | "qualifyingLaps">,
) => {
  await prisma.tournamentDrivers.deleteMany({
    where: {
      tournamentId: tournament.id,
      driverId: 0,
    },
  });

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
    where: { id },
    select: {
      id: true,
      scoreFormula: true,
      qualifyingLaps: true,
      enableQualifying: true,
      disqualifyZeros: true,
      _count: {
        select: {
          judges: true,
        },
      },
      judges: {
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      },
      drivers: {
        orderBy: { id: "asc" },
        include: {
          laps: {
            include: {
              scores: true,
            },
          },
        },
      },
      battleStages: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          sortOrder: true,
          bracketSize: true,
          format: true,
        },
      },
    },
  });

  invariant(tournament, "Missing tournament");
  invariant(tournament.battleStages.length > 0, "No battle stages");

  const judgeIds = tournament.judges.map((j) => j.id);

  await prisma.tournaments.update({
    where: { id },
    data: {
      state: TournamentsState.BATTLES,
      nextQualifyingLapId: null,
    },
  });

  const byeTounamentDriver = await addByeDriverToTournament(tournament);

  const realDrivers = tournament.drivers.filter((d) => !d.isBye);

  const driversWithScores = realDrivers.map((driver) => {
    const lapScores = driver.laps.map((lap) =>
      sumScores(
        lap.scores,
        tournament._count.judges,
        tournament.scoreFormula,
        lap.penalty,
        judgeIds,
      ),
    );

    if (
      lapScores.every((score) => score === 0) &&
      tournament.enableQualifying &&
      tournament.disqualifyZeros
    ) {
      return {
        lapScores: [] as number[],
        id: driver.id,
        tournamentDriverNumber: driver.tournamentDriverNumber,
      };
    }

    return {
      lapScores,
      id: driver.id,
      tournamentDriverNumber: driver.tournamentDriverNumber,
    };
  });

  const sortedReal = sortByQualifyingScores(
    driversWithScores,
    (d) => d.tournamentDriverNumber,
  );

  await prisma.$transaction(
    sortedReal.map((driver, i) =>
      prisma.tournamentDrivers.update({
        where: { id: driver.id },
        data: { qualifyingPosition: i + 1 },
      }),
    ),
  );

  const sortedRealIds = sortedReal.map((d) => d.id);

  const allocation = allocateDriverIdsToStages(
    sortedRealIds,
    tournament.battleStages,
  );

  const stagesOrdered = tournament.battleStages;

  for (const stage of stagesOrdered) {
    const assignedIds = allocation.get(stage.id) ?? [];
    const B = stage.bracketSize;
    const hasBump =
      stagesOrdered.length > 1 && stage.id !== stagesOrdered[0]!.id;

    const byeId = byeTounamentDriver.id;

    // Cap reals per stage to bracket capacity; pad with byes (legacy single-bracket behaviour).
    const maxReals = hasBump ? B - 1 : B;
    const fromAlloc = assignedIds.slice(0, maxReals);
    const byePad = Math.max(0, maxReals - fromAlloc.length);
    const filled = [
      ...fromAlloc,
      ...Array.from({ length: byePad }).map(() => byeId),
    ];

    let slots: (number | null)[];
    if (hasBump) {
      slots = [...filled, null];
    } else {
      slots = filled;
    }

    const rawPairs = Array.from({ length: B / 2 }, (_, i) => ({
      driverLeftId: slots[B - 1 - i] ?? null,
      driverRightId: slots[i] ?? null,
    }));

    const initialBattleDrivers = sortByInnerOuter(rawPairs);

    const r1 = toStageRound(stage.sortOrder, 1);
    const initialBattles = await prisma.tournamentBattles.findMany({
      where: {
        tournamentId: id,
        stageId: stage.id,
        round: r1,
        bracket: BattlesBracket.UPPER,
      },
      orderBy: { id: "asc" },
    });

    invariant(
      initialBattles.length === initialBattleDrivers.length,
      "Initial battle count mismatch for stage",
    );

    await prisma.$transaction(
      initialBattles.map((battle, i) =>
        prisma.tournamentBattles.update({
          where: { id: battle.id },
          data: {
            driverLeftId: initialBattleDrivers[i]!.driverLeftId,
            driverRightId: initialBattleDrivers[i]!.driverRightId,
          },
        }),
      ),
    );
  }

  await autoAdvanceByeRuns(id);
};
