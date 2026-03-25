import {
  TournamentsFormat,
  BattlesBracket,
  ScoreFormula,
} from "./enums";
import { compareQualifyingScores } from "./sortByQualifyingScores";
import { sumScores } from "./sumScores";
import { TOURNAMENT_STAGE_ROUND_BASE } from "./tournamentStageRounds";

type User = {
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  driverId: number;
  team: string | null;
};

type Driver = {
  isBye: boolean;
  id: number;
  qualifyingPosition: number | null;
  user: User;
};

type Battle = {
  winnerId: number | null;
  driverLeft: Driver | null;
  driverRight: Driver | null;
  bracket?: string;
  round?: number;
  stageId?: string | null;
};

type LapScore = {
  score: number;
  judgeId: string;
};

type Lap = {
  scores: LapScore[];
  penalty: number;
};

type TournamentDriver = {
  id: number;
  qualifyingPosition: number | null;
  isBye: boolean;
  user: User;
  tournamentDriverNumber?: number;
  laps?: Lap[];
};

export type BattleStageMeta = {
  id: string;
  sortOrder: number;
  format: TournamentsFormat;
};

type Tournament = {
  id: string;
  name?: string;
  format: TournamentsFormat;
  enableQualifying: boolean;
  battles: Battle[];
  drivers: TournamentDriver[];
  battleStages?: BattleStageMeta[];
  scoreFormula?: ScoreFormula;
  judges?: { id: string }[];
  _count?: { judges: number };
};

type BattleDriverStats = {
  id: number;
  driverId: number;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  team: string | null;
  battleCount: number;
  winCount: number;
  qualifyingPosition: number | null;
  eliminationRound?: number;
  eliminationBracket?: string;
};

function localBattleRound(round: number | undefined): number {
  if (round === undefined) return 0;
  return round % TOURNAMENT_STAGE_ROUND_BASE;
}

/**
 * Standings for a single bracket subgraph (one stage) and its format.
 */
const getBattleStandingsSingleStage = (
  battles: Battle[],
  format: TournamentsFormat,
): { driverId: number; position: number; stats: BattleDriverStats }[] => {
  if (battles.length === 0) {
    return [];
  }

  const driverMap = new Map<number, BattleDriverStats>();

  const processDriver = (driver: Driver, isWinner: boolean, battle: Battle) => {
    if (driver.isBye) return;

    const driverId = driver.user.driverId;
    const existing = driverMap.get(driverId);

    if (existing) {
      existing.battleCount++;
      if (isWinner) existing.winCount++;
      if (
        !isWinner &&
        battle.round !== undefined &&
        format === TournamentsFormat.DOUBLE_ELIMINATION
      ) {
        existing.eliminationRound = battle.round;
        existing.eliminationBracket = battle.bracket;
      }
    } else {
      driverMap.set(driverId, {
        id: driver.id,
        driverId,
        firstName: driver.user.firstName,
        lastName: driver.user.lastName,
        team: driver.user.team,
        battleCount: 1,
        winCount: isWinner ? 1 : 0,
        qualifyingPosition: driver.qualifyingPosition,
        image: driver.user.image,
        eliminationRound:
          !isWinner &&
          battle.round !== undefined &&
          format === TournamentsFormat.DOUBLE_ELIMINATION
            ? battle.round
            : undefined,
        eliminationBracket:
          !isWinner &&
          battle.bracket &&
          format === TournamentsFormat.DOUBLE_ELIMINATION
            ? battle.bracket
            : undefined,
      });
    }
  };

  battles.forEach((battle) => {
    if (battle.driverLeft) {
      processDriver(
        battle.driverLeft,
        battle.winnerId === battle.driverLeft.id,
        battle,
      );
    }
    if (battle.driverRight) {
      processDriver(
        battle.driverRight,
        battle.winnerId === battle.driverRight.id,
        battle,
      );
    }
  });

  const allDrivers = Array.from(driverMap.values());
  const finalStandings: BattleDriverStats[] = [];
  const remainingDrivers = [...allDrivers];

  const moveDriverToStandings = (driverId: number | null | undefined) => {
    if (!driverId) return false;
    const index = remainingDrivers.findIndex((d) => d.id === driverId);
    if (index === -1) return false;
    finalStandings.push(remainingDrivers.splice(index, 1)[0]!);
    return true;
  };

  const finalBattle = battles[battles.length - 1];

  if (finalBattle?.winnerId) {
    moveDriverToStandings(finalBattle.winnerId);

    const loserId =
      finalBattle.driverLeft?.id === finalBattle.winnerId
        ? finalBattle.driverRight?.id
        : finalBattle.driverLeft?.id;
    moveDriverToStandings(loserId);
  }

  if (format === TournamentsFormat.DOUBLE_ELIMINATION) {
    const lowerBracketBattles = battles.filter(
      (battle) => battle.bracket === BattlesBracket.LOWER,
    );

    if (lowerBracketBattles.length > 0) {
      const lowerFinal = lowerBracketBattles[lowerBracketBattles.length - 1];

      if (lowerFinal?.winnerId) {
        moveDriverToStandings(lowerFinal.winnerId);

        const lowerFinalLoserId =
          lowerFinal.driverLeft?.id === lowerFinal.winnerId
            ? lowerFinal.driverRight?.id
            : lowerFinal.driverLeft?.id;
        moveDriverToStandings(lowerFinalLoserId);

        if (lowerFinalLoserId) {
          const battlesWonBy3rdPlace = lowerBracketBattles.filter(
            (b) =>
              localBattleRound(b.round) !== 1001 &&
              b.winnerId === lowerFinalLoserId,
          );

          if (battlesWonBy3rdPlace.length > 0) {
            const lowerSemifinal =
              battlesWonBy3rdPlace[battlesWonBy3rdPlace.length - 1];

            const fourthPlaceId =
              lowerSemifinal.driverLeft?.id === lowerSemifinal.winnerId
                ? lowerSemifinal.driverRight?.id
                : lowerSemifinal.driverLeft?.id;
            moveDriverToStandings(fourthPlaceId);
          }
        }
      }
    }
  } else {
    const semiFinalBattle = battles[battles.length - 2];
    if (semiFinalBattle?.winnerId) {
      moveDriverToStandings(semiFinalBattle.winnerId);
    }
  }

  const sortedRemaining = remainingDrivers.sort((a, b) => {
    if (format === TournamentsFormat.DOUBLE_ELIMINATION) {
      const aElimRound = a.eliminationRound ?? 0;
      const bElimRound = b.eliminationRound ?? 0;

      if (aElimRound !== bElimRound) {
        return bElimRound - aElimRound;
      }

      if (aElimRound > 0 && bElimRound > 0) {
        const aIsUpper = a.eliminationBracket === BattlesBracket.UPPER;
        const bIsUpper = b.eliminationBracket === BattlesBracket.UPPER;
        if (aIsUpper !== bIsUpper) {
          return aIsUpper ? -1 : 1;
        }
      }
    }

    if (b.winCount !== a.winCount) {
      return b.winCount - a.winCount;
    }

    const aQualPos = a.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
    const bQualPos = b.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
    if (aQualPos !== bQualPos) {
      return aQualPos - bQualPos;
    }

    return a.id - b.id;
  });

  const orderedDrivers = [...finalStandings, ...sortedRemaining];

  return orderedDrivers.map((driver, index) => ({
    driverId: driver.driverId,
    position: index + 1,
    stats: driver,
  }));
};

function collectGlobalBattleStats(
  battles: Battle[],
): Map<number, BattleDriverStats> {
  const driverMap = new Map<number, BattleDriverStats>();

  const touch = (driver: Driver, isWinner: boolean) => {
    if (driver.isBye) return;
    const driverId = driver.user.driverId;
    const existing = driverMap.get(driverId);
    if (existing) {
      existing.battleCount++;
      if (isWinner) existing.winCount++;
    } else {
      driverMap.set(driverId, {
        id: driver.id,
        driverId,
        firstName: driver.user.firstName,
        lastName: driver.user.lastName,
        team: driver.user.team,
        image: driver.user.image,
        battleCount: 1,
        winCount: isWinner ? 1 : 0,
        qualifyingPosition: driver.qualifyingPosition,
      });
    }
  };

  for (const battle of battles) {
    if (battle.driverLeft) {
      touch(battle.driverLeft, battle.winnerId === battle.driverLeft.id);
    }
    if (battle.driverRight) {
      touch(battle.driverRight, battle.winnerId === battle.driverRight.id);
    }
  }

  return driverMap;
}

function maxStageSortForTournamentDriver(
  tournamentDriverId: number,
  battles: Battle[],
  stageOrderById: Map<string, number>,
): number {
  let max = 0;
  for (const b of battles) {
    if (
      b.driverLeft?.id === tournamentDriverId ||
      b.driverRight?.id === tournamentDriverId
    ) {
      const sid = b.stageId;
      const ord = sid ? (stageOrderById.get(sid) ?? 1) : 1;
      max = Math.max(max, ord);
    }
  }
  return max;
}

const getMultiStageBattleStandings = (
  tournament: Tournament,
): { driverId: number; position: number; stats: BattleDriverStats }[] => {
  const stages = [...(tournament.battleStages ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  if (stages.length === 0) {
    return getBattleStandingsSingleStage(tournament.battles, tournament.format);
  }

  const lastStage = stages[stages.length - 1]!;
  const lastBattles = tournament.battles.filter(
    (b) => b.stageId === lastStage.id,
  );

  const stageOrderById = new Map(stages.map((s) => [s.id, s.sortOrder]));

  const fromLast =
    lastBattles.length > 0
      ? getBattleStandingsSingleStage(lastBattles, lastStage.format)
      : [];

  const placedTdIds = new Set(fromLast.map((r) => r.stats.id));
  const globalStats = collectGlobalBattleStats(tournament.battles);

  const others: BattleDriverStats[] = [];
  for (const [, stats] of globalStats) {
    if (!placedTdIds.has(stats.id)) {
      others.push({
        ...stats,
        eliminationRound: undefined,
        eliminationBracket: undefined,
      });
    }
  }

  others.sort((a, b) => {
    const aMax = maxStageSortForTournamentDriver(
      a.id,
      tournament.battles,
      stageOrderById,
    );
    const bMax = maxStageSortForTournamentDriver(
      b.id,
      tournament.battles,
      stageOrderById,
    );
    if (bMax !== aMax) return bMax - aMax;
    if (b.winCount !== a.winCount) return b.winCount - a.winCount;
    const aQ = a.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
    const bQ = b.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
    if (aQ !== bQ) return aQ - bQ;
    return a.id - b.id;
  });

  const merged = [...fromLast.map((r) => r.stats), ...others];

  return merged.map((stats, index) => ({
    driverId: stats.driverId,
    position: index + 1,
    stats,
  }));
};

const calculateDriverLapScores = (
  driver: TournamentDriver,
  tournament: Tournament,
): number[] => {
  if (!driver.laps || driver.laps.length === 0) {
    return [];
  }

  const judgeCount =
    tournament._count?.judges ?? tournament.judges?.length ?? 0;
  const judgeIds = tournament.judges?.map((j) => j.id);
  const scoreFormula = tournament.scoreFormula ?? ScoreFormula.AVERAGE;

  return driver.laps
    .filter((lap) => lap.scores.length === judgeCount)
    .map((lap) =>
      sumScores(
        lap.scores.map((s) => ({
          ...s,
          visitorId: "",
          judgeId: s.judgeId,
          lapId: "",
        })) as any,
        judgeCount,
        scoreFormula,
        lap.penalty,
        judgeIds,
      ),
    );
};

const getQualifyingStandings = (
  tournament: Tournament,
): { driverId: number; position: number; stats: BattleDriverStats }[] => {
  const drivers = tournament.drivers.filter((d) => !d.isBye);

  const hasLapData = drivers.some((d) => d.laps && d.laps.length > 0);

  let sorted: typeof drivers;

  if (hasLapData && tournament._count?.judges) {
    const driversWithScores = drivers.map((driver) => ({
      driver,
      lapScores: calculateDriverLapScores(driver, tournament),
    }));

    sorted = driversWithScores
      .sort((a, b) =>
        compareQualifyingScores(
          a.lapScores,
          b.lapScores,
          a.driver.tournamentDriverNumber ?? a.driver.id,
          b.driver.tournamentDriverNumber ?? b.driver.id,
        ),
      )
      .map((d) => d.driver);
  } else {
    sorted = [...drivers].sort((a, b) => {
      const aPos = a.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
      const bPos = b.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
      if (aPos !== bPos) return aPos - bPos;
      return (
        (a.tournamentDriverNumber ?? a.id) -
        (b.tournamentDriverNumber ?? b.id)
      );
    });
  }

  return sorted.map((driver, index) => ({
    driverId: driver.user.driverId,
    position: index + 1,
    stats: {
      id: driver.id,
      driverId: driver.user.driverId,
      firstName: driver.user.firstName,
      lastName: driver.user.lastName,
      team: driver.user.team,
      image: driver.user.image,
      battleCount: 0,
      winCount: 0,
      qualifyingPosition: driver.qualifyingPosition,
    },
  }));
};

export const getSingleTournamentStandings = (
  tournament: Tournament,
): { driverId: number; position: number; stats: BattleDriverStats }[] => {
  if (
    (tournament.battleStages?.length ?? 0) > 0 &&
    tournament.battles.length > 0
  ) {
    const stages = tournament.battleStages ?? [];
    if (stages.length > 1) {
      return getMultiStageBattleStandings(tournament);
    }
    const fmt = stages[0]?.format ?? tournament.format;
    let battles = tournament.battles;
    if (stages.length === 1) {
      const sid = stages[0]!.id;
      battles = battles.filter(
        (b) => b.stageId == null || b.stageId === sid,
      );
    }
    return getBattleStandingsSingleStage(battles, fmt);
  }

  if (tournament.enableQualifying && tournament.drivers.length > 0) {
    return getQualifyingStandings(tournament);
  }

  return [];
};
