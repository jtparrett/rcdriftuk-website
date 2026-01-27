import type { TournamentBattles } from "@prisma/client";
import { prisma } from "./prisma.server";
import invariant from "./invariant";
import { BattlesBracket, TournamentsFormat, TournamentsState } from "./enums";

export const tournamentCreateBattles = async (id: string) => {
  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
  });

  invariant(tournament, "Tournament not found");

  let nextBattleId: number | null = null;
  const totalRounds = Math.ceil(Math.log2(tournament.bracketSize)) - 1;

  let grandFinal: TournamentBattles | null = null;
  let lowerFinal: TournamentBattles | null = null;

  await prisma.tournamentBattleVotes.deleteMany({
    where: {
      battle: {
        tournamentId: tournament.id,
      },
    },
  });

  await prisma.tournamentBattles.deleteMany({
    where: {
      tournamentId: tournament.id,
    },
  });

  if (tournament.format === TournamentsFormat.DOUBLE_ELIMINATION) {
    grandFinal = await prisma.tournamentBattles.create({
      data: {
        tournamentId: tournament.id,
        round: 1002,
        bracket: BattlesBracket.UPPER,
      },
    });

    lowerFinal = await prisma.tournamentBattles.create({
      data: {
        tournamentId: tournament.id,
        round: 1001,
        bracket: BattlesBracket.LOWER,
        winnerNextBattleId: grandFinal?.id,
      },
    });
  }

  // Create the playoff battle
  let playoffBattle: TournamentBattles | null = null;

  if (tournament.format === TournamentsFormat.STANDARD) {
    playoffBattle = await prisma.tournamentBattles.create({
      data: {
        tournamentId: tournament.id,
        round: totalRounds + 1,
        bracket: BattlesBracket.UPPER,
      },
    });
  }

  const upperFinal = await prisma.tournamentBattles.create({
    data: {
      tournamentId: tournament.id,
      round: 1000,
      bracket: BattlesBracket.UPPER,
      winnerNextBattleId: grandFinal?.id,
      loserNextBattleId: lowerFinal?.id,
    },
  });

  nextBattleId = upperFinal.id;

  const makeBattles = async (
    nextUpperBattles: TournamentBattles[],
    nextLowerBattles: TournamentBattles[],
    round: number,
  ) => {
    const totalUpperBattles = nextUpperBattles.length * 2;
    const battleRound = totalRounds + 1 - round;
    const isFirstRound = round === totalRounds;

    const totalLowerDropInToCreate =
      tournament.format === TournamentsFormat.DOUBLE_ELIMINATION &&
      !isFirstRound
        ? totalUpperBattles
        : 0;

    const lowerDropInBattles =
      await prisma.tournamentBattles.createManyAndReturn({
        data: Array.from(new Array(totalLowerDropInToCreate)).map((_, i) => {
          return {
            round: battleRound,
            tournamentId: tournament.id,
            bracket: BattlesBracket.LOWER,
          };
        }),
      });

    const totalLowerConsolidationToCreate =
      tournament.format === TournamentsFormat.DOUBLE_ELIMINATION
        ? totalUpperBattles / 2
        : 0;

    const lowerConsolidationBattles =
      await prisma.tournamentBattles.createManyAndReturn({
        data: Array.from(new Array(totalLowerConsolidationToCreate)).map(
          (_, i) => {
            return {
              round: battleRound,
              tournamentId: tournament.id,
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
          tournamentId: tournament.id,
          bracket: BattlesBracket.UPPER,
          winnerNextBattleId: nextUpperBattles[Math.floor(i / 2)]?.id,
          loserNextBattleId,
        };
      }),
    });

    nextBattleId = upperBattles[0].id;

    if (!isFirstRound && round !== totalRounds * 2) {
      await makeBattles(upperBattles, lowerDropInBattles, round + 1);
    }
  };

  await makeBattles([upperFinal], lowerFinal ? [lowerFinal] : [], 1);

  // Update tournament
  await prisma.tournaments.update({
    where: {
      id: tournament.id,
    },
    data: {
      nextBattleId,
    },
  });
};
