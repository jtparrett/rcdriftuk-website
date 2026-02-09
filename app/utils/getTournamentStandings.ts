import { TournamentsFormat, BattlesBracket, ScoreFormula } from "./enums";
import { compareQualifyingScores } from "./sortByQualifyingScores";
import { sumScores } from "./sumScores";

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

type Tournament = {
  id: string;
  name?: string;
  format: TournamentsFormat;
  enableQualifying: boolean;
  enableBattles: boolean;
  battles: Battle[];
  drivers: TournamentDriver[];
  // Optional fields for calculating qualifying scores from laps
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

/**
 * Get standings for a single tournament based on battle results
 */
const getBattleStandings = (
  tournament: Tournament,
): { driverId: number; position: number; stats: BattleDriverStats }[] => {
  const battles = tournament.battles;

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
        battle.round &&
        tournament.format === TournamentsFormat.DOUBLE_ELIMINATION
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
          battle.round &&
          tournament.format === TournamentsFormat.DOUBLE_ELIMINATION
            ? battle.round
            : undefined,
        eliminationBracket:
          !isWinner &&
          battle.bracket &&
          tournament.format === TournamentsFormat.DOUBLE_ELIMINATION
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
    finalStandings.push(remainingDrivers.splice(index, 1)[0]);
    return true;
  };

  const finalBattle = battles[battles.length - 1];

  if (finalBattle?.winnerId) {
    // 1st place: winner of final battle
    moveDriverToStandings(finalBattle.winnerId);

    // 2nd place: loser of final battle
    const loserId =
      finalBattle.driverLeft?.id === finalBattle.winnerId
        ? finalBattle.driverRight?.id
        : finalBattle.driverLeft?.id;
    moveDriverToStandings(loserId);
  }

  // Handle 3rd and 4th place based on tournament format
  if (tournament.format === TournamentsFormat.DOUBLE_ELIMINATION) {
    const lowerBracketBattles = battles.filter(
      (battle) => battle.bracket === BattlesBracket.LOWER,
    );

    if (lowerBracketBattles.length > 0) {
      // The Lower Final is the last lower bracket battle (round 1001)
      // The loser of the Lower Final is 3rd place
      const lowerFinal = lowerBracketBattles[lowerBracketBattles.length - 1];

      if (lowerFinal?.winnerId) {
        // The winner of the Lower Final is already in standings as 2nd place
        // (they lost the Grand Final), so this will just return false
        moveDriverToStandings(lowerFinal.winnerId);

        // The loser of the Lower Final is 3rd place
        const lowerFinalLoserId =
          lowerFinal.driverLeft?.id === lowerFinal.winnerId
            ? lowerFinal.driverRight?.id
            : lowerFinal.driverLeft?.id;
        moveDriverToStandings(lowerFinalLoserId);

        // 4th place is the loser of the battle where 3rd place won their way into the Lower Final
        if (lowerFinalLoserId) {
          // Find all lower bracket battles (excluding Lower Final) where 3rd place was the winner
          const battlesWonBy3rdPlace = lowerBracketBattles.filter(
            (b) => b.round !== 1001 && b.winnerId === lowerFinalLoserId,
          );

          if (battlesWonBy3rdPlace.length > 0) {
            // Get the most recent one (highest round) - last in array since sorted by round ascending
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
    // For standard format, use second-to-last battle for 3rd place
    const semiFinalBattle = battles[battles.length - 2];
    if (semiFinalBattle?.winnerId) {
      moveDriverToStandings(semiFinalBattle.winnerId);
    }
  }

  // Sort remaining drivers
  const sortedRemaining = remainingDrivers.sort((a, b) => {
    if (tournament.format === TournamentsFormat.DOUBLE_ELIMINATION) {
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

/**
 * Calculate lap scores for a driver using the tournament's scoring formula
 */
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

/**
 * Get standings for a single tournament based on qualifying results.
 * If lap data is available, calculates positions from actual scores.
 * Otherwise falls back to qualifyingPosition field.
 */
const getQualifyingStandings = (
  tournament: Tournament,
): { driverId: number; position: number; stats: BattleDriverStats }[] => {
  const drivers = tournament.drivers.filter((d) => !d.isBye);

  // Check if we have lap data to calculate scores from
  const hasLapData = drivers.some((d) => d.laps && d.laps.length > 0);

  let sorted: typeof drivers;

  if (hasLapData && tournament._count?.judges) {
    // Calculate scores from laps and sort by best scores (like qualifying table does)
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
    // Fall back to qualifyingPosition field
    sorted = [...drivers].sort((a, b) => {
      const aPos = a.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
      const bPos = b.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
      if (aPos !== bPos) return aPos - bPos;
      return a.id - b.id;
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

/**
 * Get standings for a single tournament, using battles if enabled, otherwise qualifying
 */
export const getSingleTournamentStandings = (
  tournament: Tournament,
): { driverId: number; position: number; stats: BattleDriverStats }[] => {
  // Battles take priority
  if (tournament.enableBattles && tournament.battles.length > 0) {
    return getBattleStandings(tournament);
  }

  // Fall back to qualifying
  if (tournament.enableQualifying && tournament.drivers.length > 0) {
    return getQualifyingStandings(tournament);
  }

  return [];
};
