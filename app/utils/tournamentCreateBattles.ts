import type { TournamentBattleStages } from "@prisma/client";
import { prisma } from "./prisma.server";
import invariant from "./invariant";
import { BattlesBracket, TournamentsFormat } from "./enums";
import { getBumpPairIndexForFirstRound } from "./tournamentBumpSlot";
import { getStageRoundBase, toStageRound } from "./tournamentStageRounds";

type StageRow = Pick<
  TournamentBattleStages,
  "id" | "sortOrder" | "bracketSize" | "format"
>;

export type StageBracketMeta = {
  stageId: string;
  entryBattleId: number;
  championshipBattleId: number;
  bumpTargetBattleId: number | null;
};

async function createBracketForStage(
  tournamentId: string,
  stage: StageRow,
): Promise<StageBracketMeta> {
  const bracketSize = stage.bracketSize;
  const format = stage.format;
  const stageId = stage.id;
  const rb = getStageRoundBase(stage.sortOrder);

  let nextBattleId: number | null = null;
  const totalRounds = Math.ceil(Math.log2(bracketSize)) - 1;

  let grandFinal: { id: number } | null = null;
  let lowerFinal: { id: number } | null = null;

  if (format === TournamentsFormat.DOUBLE_ELIMINATION) {
    grandFinal = await prisma.tournamentBattles.create({
      data: {
        tournamentId,
        stageId,
        round: toStageRound(stage.sortOrder, 1002),
        bracket: BattlesBracket.UPPER,
      },
    });

    lowerFinal = await prisma.tournamentBattles.create({
      data: {
        tournamentId,
        stageId,
        round: toStageRound(stage.sortOrder, 1001),
        bracket: BattlesBracket.LOWER,
        winnerNextBattleId: grandFinal.id,
      },
    });
  }

  let playoffBattle: { id: number } | null = null;

  if (format === TournamentsFormat.STANDARD) {
    playoffBattle = await prisma.tournamentBattles.create({
      data: {
        tournamentId,
        stageId,
        round: toStageRound(stage.sortOrder, totalRounds + 1),
        bracket: BattlesBracket.UPPER,
      },
    });
  }

  const upperFinal = await prisma.tournamentBattles.create({
    data: {
      tournamentId,
      stageId,
      round: toStageRound(stage.sortOrder, 1000),
      bracket: BattlesBracket.UPPER,
      winnerNextBattleId: grandFinal?.id,
      loserNextBattleId: lowerFinal?.id,
    },
  });

  nextBattleId = upperFinal.id;

  const makeBattles = async (
    nextUpperBattles: { id: number }[],
    nextLowerBattles: { id: number }[],
    round: number,
  ) => {
    const totalUpperBattles = nextUpperBattles.length * 2;
    const localBattleRound = totalRounds + 1 - round;
    const battleRound = toStageRound(stage.sortOrder, localBattleRound);
    const isFirstRound = round === totalRounds;

    const totalLowerDropInToCreate =
      format === TournamentsFormat.DOUBLE_ELIMINATION && !isFirstRound
        ? totalUpperBattles
        : 0;

    const lowerDropInBattles =
      await prisma.tournamentBattles.createManyAndReturn({
        data: Array.from(new Array(totalLowerDropInToCreate)).map(() => ({
          round: battleRound,
          tournamentId,
          stageId,
          bracket: BattlesBracket.LOWER,
        })),
      });

    const totalLowerConsolidationToCreate =
      format === TournamentsFormat.DOUBLE_ELIMINATION
        ? totalUpperBattles / 2
        : 0;

    const lowerConsolidationBattles =
      await prisma.tournamentBattles.createManyAndReturn({
        data: Array.from(new Array(totalLowerConsolidationToCreate)).map(
          (_, i) => ({
            round: battleRound,
            tournamentId,
            stageId,
            bracket: BattlesBracket.LOWER,
            winnerNextBattleId: nextLowerBattles[i]?.id,
          }),
        ),
      });

    await prisma.$transaction(
      lowerDropInBattles.map((battle, i) =>
        prisma.tournamentBattles.update({
          where: { id: battle.id },
          data: {
            winnerNextBattleId:
              lowerConsolidationBattles[Math.floor(i / 2)]?.id,
          },
        }),
      ),
    );

    const upperBattles = await prisma.tournamentBattles.createManyAndReturn({
      data: Array.from(new Array(totalUpperBattles)).map((_, i) => {
        let loserNextBattleId = isFirstRound
          ? lowerConsolidationBattles[Math.floor(i / 2)]?.id
          : lowerDropInBattles[totalUpperBattles - 1 - i]?.id;

        if (playoffBattle && round === 1) {
          loserNextBattleId = playoffBattle.id;
        }

        return {
          round: battleRound,
          tournamentId,
          stageId,
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

  const entryBattleId = nextBattleId!;

  const championshipBattleId =
    format === TournamentsFormat.DOUBLE_ELIMINATION
      ? grandFinal!.id
      : upperFinal.id;

  const bumpPairIndex = getBumpPairIndexForFirstRound(bracketSize);
  const r1 = toStageRound(stage.sortOrder, 1);
  const initialBattles = await prisma.tournamentBattles.findMany({
    where: {
      tournamentId,
      stageId,
      round: r1,
      bracket: BattlesBracket.UPPER,
    },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  const bumpTargetBattleId =
    initialBattles[bumpPairIndex]?.id ?? initialBattles[0]?.id ?? null;

  return {
    stageId,
    entryBattleId,
    championshipBattleId,
    bumpTargetBattleId,
  };
}

export const tournamentCreateBattles = async (id: string) => {
  const tournament = await prisma.tournaments.findFirst({
    where: { id },
  });

  invariant(tournament, "Tournament not found");

  const stages = await prisma.tournamentBattleStages.findMany({
    where: { tournamentId: id },
    orderBy: { sortOrder: "asc" },
  });

  invariant(stages.length > 0, "No battle stages");

  await prisma.tournamentBattleVotes.deleteMany({
    where: {
      battle: { tournamentId: tournament.id },
    },
  });

  await prisma.tournamentBattles.deleteMany({
    where: { tournamentId: tournament.id },
  });

  const metas: StageBracketMeta[] = [];
  for (const stage of stages) {
    metas.push(await createBracketForStage(tournament.id, stage));
  }

  for (let i = 0; i < metas.length - 1; i++) {
    const fromMeta = metas[i]!;
    const toMeta = metas[i + 1]!;
    if (toMeta.bumpTargetBattleId) {
      await prisma.tournamentBattles.update({
        where: { id: fromMeta.championshipBattleId },
        data: { winnerNextBattleId: toMeta.bumpTargetBattleId },
      });
    }
  }

  await prisma.tournaments.update({
    where: { id },
    data: {
      nextBattleId: metas[0]!.entryBattleId,
    },
  });
};
