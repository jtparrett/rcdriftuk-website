import type { TournamentBattles } from "@prisma/client";
import { prisma } from "./prisma.server";
import invariant from "./invariant";
import { BattlesBracket, TournamentsFormat } from "./enums";

/**
 * Creates all battles for a single tournament bracket.
 * Returns the first battle id for this bracket.
 */
const createBracketBattles = async (
  tournamentId: string,
  tournamentBracketId: number,
  bracketSize: number,
  format: string,
): Promise<number> => {
  let firstBattleId: number | null = null;
  const totalRounds = Math.ceil(Math.log2(bracketSize)) - 1;

  let grandFinal: TournamentBattles | null = null;
  let lowerFinal: TournamentBattles | null = null;

  if (format === TournamentsFormat.DOUBLE_ELIMINATION) {
    grandFinal = await prisma.tournamentBattles.create({
      data: {
        tournamentId,
        tournamentBracketId,
        round: 1002,
        bracket: BattlesBracket.UPPER,
      },
    });

    lowerFinal = await prisma.tournamentBattles.create({
      data: {
        tournamentId,
        tournamentBracketId,
        round: 1001,
        bracket: BattlesBracket.LOWER,
        winnerNextBattleId: grandFinal.id,
      },
    });
  }

  // Create the playoff battle
  let playoffBattle: TournamentBattles | null = null;

  if (format === TournamentsFormat.STANDARD) {
    playoffBattle = await prisma.tournamentBattles.create({
      data: {
        tournamentId,
        tournamentBracketId,
        round: totalRounds + 1,
        bracket: BattlesBracket.UPPER,
      },
    });
  }

  const upperFinal = await prisma.tournamentBattles.create({
    data: {
      tournamentId,
      tournamentBracketId,
      round: 1000,
      bracket: BattlesBracket.UPPER,
      winnerNextBattleId: grandFinal?.id,
      loserNextBattleId: lowerFinal?.id,
    },
  });

  firstBattleId = upperFinal.id;

  const makeBattles = async (
    nextUpperBattles: TournamentBattles[],
    nextLowerBattles: TournamentBattles[],
    round: number,
  ) => {
    const totalUpperBattles = nextUpperBattles.length * 2;
    const battleRound = totalRounds + 1 - round;
    const isFirstRound = round === totalRounds;

    const totalLowerDropInToCreate =
      format === TournamentsFormat.DOUBLE_ELIMINATION && !isFirstRound
        ? totalUpperBattles
        : 0;

    const lowerDropInBattles =
      await prisma.tournamentBattles.createManyAndReturn({
        data: Array.from(new Array(totalLowerDropInToCreate)).map(() => {
          return {
            round: battleRound,
            tournamentId,
            tournamentBracketId,
            bracket: BattlesBracket.LOWER,
          };
        }),
      });

    const totalLowerConsolidationToCreate =
      format === TournamentsFormat.DOUBLE_ELIMINATION
        ? totalUpperBattles / 2
        : 0;

    const lowerConsolidationBattles =
      await prisma.tournamentBattles.createManyAndReturn({
        data: Array.from(new Array(totalLowerConsolidationToCreate)).map(
          (_, i) => {
            return {
              round: battleRound,
              tournamentId,
              tournamentBracketId,
              bracket: BattlesBracket.LOWER,
              winnerNextBattleId: nextLowerBattles[i]?.id,
            };
          },
        ),
      });

    // I don't like this update
    // But it's needed so the running order is correct
    await prisma.$transaction(
      lowerDropInBattles.map((battle, i) => {
        return prisma.tournamentBattles.update({
          where: {
            id: battle.id,
          },
          data: {
            winnerNextBattleId:
              lowerConsolidationBattles[Math.floor(i / 2)]?.id,
          },
        });
      }),
    );

    // Upper battles
    const upperBattles = await prisma.tournamentBattles.createManyAndReturn({
      data: Array.from(new Array(totalUpperBattles)).map((_, i) => {
        let loserNextBattleId = isFirstRound
          ? lowerConsolidationBattles[Math.floor(i / 2)]?.id
          : lowerDropInBattles[totalUpperBattles - 1 - i]?.id;

        if (playoffBattle && round === 1) {
          loserNextBattleId = playoffBattle?.id;
        }

        return {
          round: battleRound,
          tournamentId,
          tournamentBracketId,
          bracket: BattlesBracket.UPPER,
          winnerNextBattleId: nextUpperBattles[Math.floor(i / 2)]?.id,
          loserNextBattleId,
        };
      }),
    });

    firstBattleId = upperBattles[0].id;

    if (!isFirstRound && round !== totalRounds * 2) {
      await makeBattles(upperBattles, lowerDropInBattles, round + 1);
    }
  };

  await makeBattles([upperFinal], lowerFinal ? [lowerFinal] : [], 1);

  invariant(firstBattleId, "No battles created");
  return firstBattleId;
};

/**
 * Gets the final battle of a bracket (the one whose winner should advance).
 * For double elimination this is the grand final (round 1002).
 * For standard this is the upper final (round 1000).
 */
const getFinalBattle = async (tournamentBracketId: number, format: string) => {
  const round =
    format === TournamentsFormat.DOUBLE_ELIMINATION ? 1002 : 1000;
  return prisma.tournamentBattles.findFirst({
    where: {
      tournamentBracketId,
      round,
      bracket: BattlesBracket.UPPER,
    },
  });
};

/**
 * Creates battles for all brackets in a tournament.
 * Links bracket winners to the next bracket's empty slot.
 */
export const tournamentCreateBattles = async (tournamentId: string) => {
  const tournament = await prisma.tournaments.findFirst({
    where: { id: tournamentId },
    include: {
      brackets: {
        orderBy: { id: "asc" },
      },
    },
  });

  invariant(tournament, "Tournament not found");

  // Delete all existing battles for this tournament
  await prisma.tournamentBattleVotes.deleteMany({
    where: {
      battle: {
        tournamentId,
      },
    },
  });

  await prisma.tournamentBattles.deleteMany({
    where: {
      tournamentId,
    },
  });

  if (tournament.brackets.length === 0) {
    await prisma.tournaments.update({
      where: { id: tournamentId },
      data: { nextBattleId: null },
    });
    return;
  }

  let firstBattleIdOverall: number | null = null;

  // Create battles for each bracket
  for (const bracket of tournament.brackets) {
    const firstBattleId = await createBracketBattles(
      tournamentId,
      bracket.id,
      bracket.bracketSize,
      bracket.format,
    );

    if (!firstBattleIdOverall) {
      firstBattleIdOverall = firstBattleId;
    }
  }

  // Link bracket finals to next bracket's empty slot
  // This linking happens at seeding time when we know which slot is empty
  // (see tournamentSeedBattles.ts)

  await prisma.tournaments.update({
    where: { id: tournamentId },
    data: { nextBattleId: firstBattleIdOverall },
  });
};

export { getFinalBattle };
