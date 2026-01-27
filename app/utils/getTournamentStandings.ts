import { TournamentsFormat, BattlesBracket } from "./enums";

type User = {
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  driverId: number;
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

type TournamentDriver = {
  id: number;
  qualifyingPosition: number | null;
  isBye: boolean;
  user: User;
};

type Tournament = {
  id: string;
  name?: string;
  format: TournamentsFormat;
  enableQualifying: boolean;
  enableBattles: boolean;
  battles: Battle[];
  drivers: TournamentDriver[];
};

type DriverStanding = {
  driverId: number;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  points: number;
  tournamentResults: {
    tournamentId: string;
    position: number;
    points: number;
  }[];
  // Legacy fields for backward compatibility
  id: number;
  battleCount: number;
  winCount: number;
  qualifyingPosition: number | null;
};

// Professional drifting championship points allocation
// Based on finishing position only
const POINTS_BY_POSITION: Record<number, number> = {
  // Podium
  1: 100,
  2: 90,
  3: 80,
  4: 70,
  // Top 8
  5: 60,
  6: 50,
  7: 45,
  8: 40,
  // Top 16
  9: 35,
  10: 30,
  11: 28,
  12: 26,
  13: 24,
  14: 22,
  15: 20,
  16: 18,
  // Top 32 / Qualifying only
  17: 15,
  18: 14,
  19: 13,
  20: 12,
  21: 11,
  22: 10,
  23: 9,
  24: 8,
  25: 7,
  26: 6,
  27: 5,
  28: 5,
  29: 5,
  30: 5,
  31: 5,
  32: 5,
};

const getPointsForPosition = (position: number): number => {
  if (position <= 32) {
    return POINTS_BY_POSITION[position] ?? 5;
  }
  // Participation points for positions beyond 32
  return 2;
};

type BattleDriverStats = {
  id: number;
  driverId: number;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
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
      const lowerFinal = lowerBracketBattles[lowerBracketBattles.length - 2];

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
 * Get standings for a single tournament based on qualifying results
 */
const getQualifyingStandings = (
  tournament: Tournament,
): { driverId: number; position: number; stats: BattleDriverStats }[] => {
  const drivers = tournament.drivers.filter((d) => !d.isBye);

  const sorted = [...drivers].sort((a, b) => {
    const aPos = a.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
    const bPos = b.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
    if (aPos !== bPos) return aPos - bPos;
    return a.id - b.id;
  });

  return sorted.map((driver, index) => ({
    driverId: driver.user.driverId,
    position: index + 1,
    stats: {
      id: driver.id,
      driverId: driver.user.driverId,
      firstName: driver.user.firstName,
      lastName: driver.user.lastName,
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
const getSingleTournamentStandings = (
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

/**
 * Get combined standings across multiple tournaments.
 * Drivers are ranked by total points accumulated across all tournaments.
 * Points are awarded based on finishing position in each tournament.
 */
export const getTournamentStandings = (
  tournaments: Tournament[],
): DriverStanding[] => {
  if (tournaments.length === 0) {
    return [];
  }

  const driverMap = new Map<
    number,
    {
      driverId: number;
      firstName: string | null;
      lastName: string | null;
      image: string | null;
      totalPoints: number;
      tournamentResults: {
        tournamentId: string;
        position: number;
        points: number;
      }[];
      // Track the best stats for legacy fields
      bestStats: BattleDriverStats | null;
      totalBattleCount: number;
      totalWinCount: number;
    }
  >();

  // Process each tournament
  for (const tournament of tournaments) {
    const standings = getSingleTournamentStandings(tournament);

    for (const { driverId, position, stats } of standings) {
      const points = getPointsForPosition(position);
      const existing = driverMap.get(driverId);

      if (existing) {
        existing.totalPoints += points;
        existing.tournamentResults.push({
          tournamentId: tournament.id,
          position,
          points,
        });
        existing.totalBattleCount += stats.battleCount;
        existing.totalWinCount += stats.winCount;
        // Keep the best qualifying position
        if (
          stats.qualifyingPosition !== null &&
          (existing.bestStats?.qualifyingPosition === null ||
            existing.bestStats?.qualifyingPosition === undefined ||
            stats.qualifyingPosition < existing.bestStats.qualifyingPosition)
        ) {
          existing.bestStats = stats;
        }
      } else {
        driverMap.set(driverId, {
          driverId,
          firstName: stats.firstName,
          lastName: stats.lastName,
          image: stats.image,
          totalPoints: points,
          tournamentResults: [
            {
              tournamentId: tournament.id,
              position,
              points,
            },
          ],
          bestStats: stats,
          totalBattleCount: stats.battleCount,
          totalWinCount: stats.winCount,
        });
      }
    }
  }

  // Convert to array and sort by total points (descending)
  const sortedDrivers = Array.from(driverMap.values()).sort((a, b) => {
    // Primary: total points (descending)
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    // Secondary: number of tournament appearances (descending)
    if (b.tournamentResults.length !== a.tournamentResults.length) {
      return b.tournamentResults.length - a.tournamentResults.length;
    }

    // Tertiary: best single tournament position (ascending)
    const aBestPos = Math.min(...a.tournamentResults.map((r) => r.position));
    const bBestPos = Math.min(...b.tournamentResults.map((r) => r.position));
    if (aBestPos !== bBestPos) {
      return aBestPos - bBestPos;
    }

    // Finally: total wins (descending)
    return b.totalWinCount - a.totalWinCount;
  });

  // Return with all required fields
  return sortedDrivers.map((driver) => ({
    driverId: driver.driverId,
    firstName: driver.firstName,
    lastName: driver.lastName,
    image: driver.image,
    points: driver.totalPoints,
    tournamentResults: driver.tournamentResults,
    // Legacy fields for backward compatibility
    id: driver.bestStats?.id ?? 0,
    battleCount: driver.totalBattleCount,
    winCount: driver.totalWinCount,
    qualifyingPosition: driver.bestStats?.qualifyingPosition ?? null,
  }));
};
