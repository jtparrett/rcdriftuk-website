import type { Tournaments } from "@prisma/client";
import {
  BattlesBracket,
  TournamentsFormat,
  TournamentsState,
} from "~/utils/enums";
import invariant from "~/utils/invariant";
import { sortByInnerOuter } from "~/utils/innerOuterSorting";
import { prisma } from "~/utils/prisma.server";
import { sortByQualifyingScores } from "~/utils/sortByQualifyingScores";
import { sumScores } from "~/utils/sumScores";
import { autoAdvanceByeRuns } from "~/utils/autoAdvanceByeRuns.server";
import { setTournamentFinishingPositions } from "./setTournamentFinishingPositions";
import { getFinalBattle } from "./tournamentCreateBattles";

const addByeDriverToTournament = async (
  tournament: Pick<Tournaments, "id" | "qualifyingLaps">,
) => {
  await prisma.tournamentDrivers.deleteMany({
    where: {
      tournamentId: tournament.id,
      driverId: 0,
    },
  });

  const byeTournamentDriver = await prisma.tournamentDrivers.create({
    data: {
      isBye: true,
      tournamentId: tournament.id,
      driverId: 0,
    },
  });

  await prisma.laps.createMany({
    data: Array.from(new Array(tournament.qualifyingLaps)).map((_, i) => ({
      tournamentDriverId: byeTournamentDriver.id,
      round: i + 1,
    })),
  });

  return byeTournamentDriver;
};

/**
 * Determines whether the empty slot (for cross-bracket advancement) is at
 * the last or second-to-last position in the bracket.
 */
const getAdvanceSlotOffset = (): number => {
  const slot = "SECOND_TO_LAST";
  return slot === "SECOND_TO_LAST" ? 2 : 1;
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
      brackets: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          bracketSize: true,
          format: true,
        },
      },
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
            include: { scores: true },
          },
        },
      },
    },
  });

  invariant(tournament, "Missing tournament");

  const hasBattles = tournament.brackets.length > 0;

  await prisma.tournaments.update({
    where: { id },
    data: {
      state: hasBattles ? TournamentsState.BATTLES : TournamentsState.END,
      nextQualifyingLapId: null,
    },
  });

  if (!hasBattles) {
    await setTournamentFinishingPositions(id);
    return;
  }

  const judgeIds = tournament.judges.map((j) => j.id);
  const byeTournamentDriver = await addByeDriverToTournament(tournament);

  // Exclude the old bye driver (just deleted) so we never reference its id in updates
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
        lapScores: [],
        id: byeTournamentDriver.id,
        tournamentDriverNumber: byeTournamentDriver.tournamentDriverNumber,
      };
    }

    return {
      lapScores,
      id: driver.id,
      tournamentDriverNumber: driver.tournamentDriverNumber,
    };
  });

  const sortedDrivers = sortByQualifyingScores(
    driversWithScores,
    (d) => d.tournamentDriverNumber,
  );

  // Set qualifying positions (exclude bye driver)
  await prisma.$transaction(
    sortedDrivers
      .filter((driver) => driver.id !== byeTournamentDriver.id)
      .map((driver, i) => {
        return prisma.tournamentDrivers.update({
          where: { id: driver.id },
          data: { qualifyingPosition: i + 1 },
        });
      }),
  );

  // Allocate drivers to brackets (last bracket first)
  const brackets = tournament.brackets;
  const advanceSlotOffset = getAdvanceSlotOffset();

  // Calculate how many driver slots each bracket needs
  // First bracket: full size. Other brackets: size - 1 (one empty slot for previous winner)
  const bracketAllocations: {
    bracket: (typeof brackets)[number];
    slotCount: number;
  }[] = brackets.map((bracket, index) => ({
    bracket,
    slotCount: index === 0 ? bracket.bracketSize : bracket.bracketSize - 1,
  }));

  // Take drivers from the sorted list, filling from last bracket to first
  let driverIndex = 0;
  const bracketDrivers: Map<
    number,
    { id: number; tournamentDriverNumber: number }[]
  > = new Map();

  for (let i = bracketAllocations.length - 1; i >= 0; i--) {
    const { bracket, slotCount } = bracketAllocations[i];
    const drivers: { id: number; tournamentDriverNumber: number }[] = [];

    for (let j = 0; j < slotCount; j++) {
      if (driverIndex < sortedDrivers.length) {
        drivers.push(sortedDrivers[driverIndex]);
        driverIndex++;
      } else {
        // Pad with bye runs
        drivers.push({
          id: byeTournamentDriver.id,
          tournamentDriverNumber: driverIndex + 1,
        });
        driverIndex++;
      }
    }

    bracketDrivers.set(bracket.id, drivers);
  }

  // Seed each bracket's first-round battles
  for (let bracketIndex = 0; bracketIndex < brackets.length; bracketIndex++) {
    const bracket = brackets[bracketIndex];
    const drivers = bracketDrivers.get(bracket.id)!;
    const isFirstBracket = bracketIndex === 0;

    // For non-first brackets, we need to insert an empty slot
    let fullDriverList: { id: number }[];

    if (isFirstBracket) {
      // First bracket: all slots filled
      fullDriverList = drivers;
    } else {
      // Non-first brackets: insert empty slot (null) at the configured position
      // advanceSlotOffset=1 means last slot, advanceSlotOffset=2 means second-to-last
      fullDriverList = [...drivers];
      const insertIndex = bracket.bracketSize - advanceSlotOffset;
      fullDriverList.splice(insertIndex, 0, { id: 0 }); // placeholder for empty slot
    }

    // Pad to full bracket size with byes if needed
    while (fullDriverList.length < bracket.bracketSize) {
      fullDriverList.push({ id: byeTournamentDriver.id });
    }

    const initialBattles = await prisma.tournamentBattles.findMany({
      where: {
        tournamentBracketId: bracket.id,
        round: 1,
        bracket: BattlesBracket.UPPER,
      },
      orderBy: { id: "asc" },
    });

    const matchups = Array.from(new Array(bracket.bracketSize / 2)).map(
      (_, i) => {
        const driverLeft = fullDriverList[bracket.bracketSize - i - 1];
        const driverRight = fullDriverList[i];

        return {
          driverLeftId: driverLeft.id === 0 ? null : driverLeft.id,
          driverRightId: driverRight.id === 0 ? null : driverRight.id,
        };
      },
    );

    const seededMatchups = sortByInnerOuter(matchups);

    await prisma.$transaction(
      initialBattles.map((battle, i) => {
        return prisma.tournamentBattles.update({
          where: { id: battle.id },
          data: {
            driverLeftId: seededMatchups[i].driverLeftId,
            driverRightId: seededMatchups[i].driverRightId,
          },
        });
      }),
    );
  }

  // Link bracket finals to next bracket's empty slot
  for (let i = 0; i < brackets.length - 1; i++) {
    const currentBracket = brackets[i];
    const nextBracket = brackets[i + 1];

    const finalBattle = await getFinalBattle(
      currentBracket.id,
      currentBracket.format,
    );
    invariant(finalBattle, "Final battle not found for bracket");

    // Find the first-round battle in the next bracket that has an empty slot
    const emptySlotBattle = await prisma.tournamentBattles.findFirst({
      where: {
        tournamentBracketId: nextBracket.id,
        round: 1,
        bracket: BattlesBracket.UPPER,
        OR: [{ driverLeftId: null }, { driverRightId: null }],
      },
      orderBy: { id: "asc" },
    });

    invariant(emptySlotBattle, "Empty slot battle not found in next bracket");

    await prisma.tournamentBattles.update({
      where: { id: finalBattle.id },
      data: { winnerNextBattleId: emptySlotBattle.id },
    });
  }

  // After setting up all battles, auto-advance bye runs
  await autoAdvanceByeRuns(id);
};
