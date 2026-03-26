import { TournamentsFormat, BattlesBracket, ScoreFormula } from "./enums";
import { compareQualifyingScores } from "./sortByQualifyingScores";
import { sumScores } from "./sumScores";

/**
 * Tournament Standings
 * ====================
 *
 * How standings are determined (in priority order):
 *
 * 1. If the tournament has battles, use battle results.
 * 2. Otherwise, fall back to qualifying results.
 *
 * Battle standings for a single bracket (standard elimination):
 *   - 1st: Winner of the final
 *   - 2nd: Loser of the final
 *   - 3rd: Winner of the losing semifinal (the driver who lost in the semis
 *          but had the better record)
 *   - Remaining: sorted by most wins, then best qualifying position
 *
 * Battle standings for a single bracket (double elimination):
 *   - 1st: Winner of the grand final (last UPPER battle)
 *   - 2nd: Loser of the grand final
 *   - 3rd: Loser of the lower final
 *   - 4th: Driver who lost to 3rd place in their last lower bracket battle
 *   - Remaining: sorted by elimination round (later = better),
 *     then upper bracket > lower bracket, then wins, then qualifying position
 *
 * Multi-bracket tournaments (e.g. Lower 4 -> Middle 8 -> Top 8):
 *   - Process brackets from LAST to FIRST (Top 8 first, then Middle 8, etc.)
 *   - All drivers from the last bracket rank above all drivers from earlier brackets
 *   - Within each bracket, use the single-bracket logic above
 *   - Drivers who advanced (bracket winners) only count in their highest bracket
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  tournamentBracketId?: number | null;
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

type TournamentBracket = {
  id: number;
  format: TournamentsFormat;
};

type Tournament = {
  id: string;
  name?: string;
  format: TournamentsFormat;
  enableQualifying: boolean;
  battles: Battle[];
  drivers: TournamentDriver[];
  brackets?: TournamentBracket[];
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

type Standing = {
  driverId: number;
  position: number;
  stats: BattleDriverStats;
};

// ---------------------------------------------------------------------------
// Step 1: Collect driver stats from battles
// ---------------------------------------------------------------------------

/** Scan all battles and build a stats map for every non-bye driver. */
const collectDriverStats = (
  battles: Battle[],
  format: TournamentsFormat,
): Map<number, BattleDriverStats> => {
  const stats = new Map<number, BattleDriverStats>();

  for (const battle of battles) {
    if (battle.driverLeft) {
      recordDriver(stats, battle.driverLeft, battle, format);
    }
    if (battle.driverRight) {
      recordDriver(stats, battle.driverRight, battle, format);
    }
  }

  return stats;
};

/** Record a single driver's participation in a battle. */
const recordDriver = (
  stats: Map<number, BattleDriverStats>,
  driver: Driver,
  battle: Battle,
  format: TournamentsFormat,
): void => {
  if (driver.isBye) return;

  const isWinner = battle.winnerId === driver.id;
  const isDoubleElim = format === TournamentsFormat.DOUBLE_ELIMINATION;
  const wasEliminated = !isWinner && battle.round && isDoubleElim;

  const existing = stats.get(driver.user.driverId);

  if (existing) {
    existing.battleCount++;
    if (isWinner) existing.winCount++;
    if (wasEliminated) {
      existing.eliminationRound = battle.round;
      existing.eliminationBracket = battle.bracket;
    }
  } else {
    stats.set(driver.user.driverId, {
      id: driver.id,
      driverId: driver.user.driverId,
      firstName: driver.user.firstName,
      lastName: driver.user.lastName,
      team: driver.user.team,
      image: driver.user.image,
      battleCount: 1,
      winCount: isWinner ? 1 : 0,
      qualifyingPosition: driver.qualifyingPosition,
      eliminationRound: wasEliminated ? battle.round : undefined,
      eliminationBracket: wasEliminated ? battle.bracket : undefined,
    });
  }
};

// ---------------------------------------------------------------------------
// Step 2: Determine top positions from a bracket's battles
// ---------------------------------------------------------------------------

/** Get the loser of a battle (the driver who didn't win). */
const getLoserOfBattle = (battle: Battle): number | null | undefined => {
  if (!battle.winnerId) return undefined;
  return battle.driverLeft?.id === battle.winnerId
    ? battle.driverRight?.id
    : battle.driverLeft?.id;
};

/**
 * Standard elimination: place the final winner, final loser, and semifinal loser.
 * Returns tournament driver IDs in finishing order [1st, 2nd, 3rd].
 */
const getStandardTopPositions = (
  battles: Battle[],
): (number | null | undefined)[] => {
  const finalBattle = battles[battles.length - 1];
  if (!finalBattle?.winnerId) return [];

  const semiFinalBattle = battles[battles.length - 2];

  return [
    finalBattle.winnerId, // 1st: winner of the final
    getLoserOfBattle(finalBattle), // 2nd: loser of the final
    semiFinalBattle?.winnerId ?? undefined, // 3rd: winner of the losing semifinal
  ];
};

/**
 * Double elimination: place grand final winner/loser, lower final loser, and 4th.
 * Returns tournament driver IDs in finishing order [1st, 2nd, 3rd, 4th].
 */
const getDoubleElimTopPositions = (
  battles: Battle[],
): (number | null | undefined)[] => {
  // The grand final is the last battle overall (last UPPER bracket battle)
  const grandFinal = battles[battles.length - 1];
  if (!grandFinal?.winnerId) return [];

  const positions: (number | null | undefined)[] = [
    grandFinal.winnerId, // 1st: grand final winner
    getLoserOfBattle(grandFinal), // 2nd: grand final loser
  ];

  // The lower final is the last LOWER bracket battle
  const lowerBattles = battles.filter(
    (b) => b.bracket === BattlesBracket.LOWER,
  );
  const lowerFinal = lowerBattles[lowerBattles.length - 1];

  if (lowerFinal?.winnerId) {
    // Lower final winner may already be placed as 2nd (they lost the grand final).
    // Push anyway - duplicates are skipped when placing.
    positions.push(lowerFinal.winnerId);

    // 3rd: loser of lower final
    const lowerFinalLoserId = getLoserOfBattle(lowerFinal);
    positions.push(lowerFinalLoserId);

    // 4th: the driver who lost to 3rd place in their last lower bracket match
    if (lowerFinalLoserId) {
      const fourthPlaceId = findFourthPlaceInDoubleElim(
        lowerBattles,
        lowerFinalLoserId,
      );
      positions.push(fourthPlaceId);
    }
  }

  return positions;
};

/**
 * In double elim, 4th place is the driver who lost to the 3rd-place driver
 * in their most recent lower bracket battle (excluding the lower final itself).
 */
const findFourthPlaceInDoubleElim = (
  lowerBattles: Battle[],
  thirdPlaceDriverId: number,
): number | null | undefined => {
  // Find all lower bracket battles (excluding lower final, round 1001)
  // where 3rd place was the winner
  const battlesWonByThird = lowerBattles.filter(
    (b) => b.round !== 1001 && b.winnerId === thirdPlaceDriverId,
  );

  if (battlesWonByThird.length === 0) return undefined;

  // Most recent one (battles are sorted by round ascending, so last = latest)
  const lastBattle = battlesWonByThird[battlesWonByThird.length - 1];
  return getLoserOfBattle(lastBattle);
};

// ---------------------------------------------------------------------------
// Step 3: Sort remaining drivers who weren't explicitly placed
// ---------------------------------------------------------------------------

/** Sort unplaced drivers: best performance first. */
const sortRemainingDrivers = (
  drivers: BattleDriverStats[],
  format: TournamentsFormat,
): BattleDriverStats[] => {
  return [...drivers].sort((a, b) => {
    // Double elim: later elimination round = better
    if (format === TournamentsFormat.DOUBLE_ELIMINATION) {
      const roundDiff = (b.eliminationRound ?? 0) - (a.eliminationRound ?? 0);
      if (roundDiff !== 0) return roundDiff;

      // Same round: upper bracket elimination > lower bracket elimination
      if ((a.eliminationRound ?? 0) > 0 && (b.eliminationRound ?? 0) > 0) {
        const aIsUpper = a.eliminationBracket === BattlesBracket.UPPER;
        const bIsUpper = b.eliminationBracket === BattlesBracket.UPPER;
        if (aIsUpper !== bIsUpper) return aIsUpper ? -1 : 1;
      }
    }

    // More wins = better
    if (b.winCount !== a.winCount) return b.winCount - a.winCount;

    // Better qualifying position = better
    const aQualPos = a.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
    const bQualPos = b.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
    if (aQualPos !== bQualPos) return aQualPos - bQualPos;

    // Tie-break: lower tournament driver ID = added to tournament first = advantage
    return a.id - b.id;
  });
};

// ---------------------------------------------------------------------------
// Step 4: Combine into ordered standings for one bracket
// ---------------------------------------------------------------------------

/**
 * Get standings for a single bracket's battles.
 * Returns drivers in finishing order (1st, 2nd, 3rd, ...).
 */
const getSingleBracketStandings = (
  battles: Battle[],
  format: TournamentsFormat,
): BattleDriverStats[] => {
  if (battles.length === 0) return [];

  // Collect stats for every driver in this bracket
  const driverStats = collectDriverStats(battles, format);
  const remaining = new Map(driverStats);
  const placed: BattleDriverStats[] = [];

  // Place a driver by their tournament driver ID (battle-level id, not driverId)
  const placeDriver = (tournamentDriverId: number | null | undefined) => {
    if (!tournamentDriverId) return;
    // Find by the battle-level driver id (stats.id)
    for (const [key, stats] of remaining) {
      if (stats.id === tournamentDriverId) {
        placed.push(stats);
        remaining.delete(key);
        return;
      }
    }
  };

  // Determine top positions based on format
  const topPositions =
    format === TournamentsFormat.DOUBLE_ELIMINATION
      ? getDoubleElimTopPositions(battles)
      : getStandardTopPositions(battles);

  for (const driverId of topPositions) {
    placeDriver(driverId);
  }

  // Sort everyone else by performance
  const sorted = sortRemainingDrivers(Array.from(remaining.values()), format);

  return [...placed, ...sorted];
};

// ---------------------------------------------------------------------------
// Step 5: Multi-bracket - merge standings across brackets
// ---------------------------------------------------------------------------

/**
 * For multi-bracket tournaments, process brackets from LAST to FIRST.
 * Drivers in later brackets always rank above drivers in earlier brackets.
 * Drivers who advanced (bracket winners) only appear in their highest bracket.
 */
const getMultiBracketStandings = (
  battles: Battle[],
  brackets: TournamentBracket[],
): BattleDriverStats[] => {
  const placedIds = new Set<number>(); // tournament driver IDs already placed
  const allStandings: BattleDriverStats[] = [];

  // Process from last bracket (highest prestige) to first
  for (let i = brackets.length - 1; i >= 0; i--) {
    const bracket = brackets[i];
    const bracketBattles = battles.filter(
      (b) => b.tournamentBracketId === bracket.id,
    );

    const bracketStandings = getSingleBracketStandings(
      bracketBattles,
      bracket.format,
    );

    // Add drivers we haven't placed yet (skip those who advanced to a later bracket)
    for (const driver of bracketStandings) {
      if (!placedIds.has(driver.id)) {
        allStandings.push(driver);
        placedIds.add(driver.id);
      }
    }
  }

  return allStandings;
};

// ---------------------------------------------------------------------------
// Step 6: Assign position numbers
// ---------------------------------------------------------------------------

const assignPositions = (standings: BattleDriverStats[]): Standing[] =>
  standings.map((driver, index) => ({
    driverId: driver.driverId,
    position: index + 1,
    stats: driver,
  }));

// ---------------------------------------------------------------------------
// Battle standings entry point
// ---------------------------------------------------------------------------

const getBattleStandings = (tournament: Tournament): Standing[] => {
  if (tournament.battles.length === 0) return [];

  const brackets = tournament.brackets ?? [];

  if (brackets.length > 1) {
    // Multi-bracket: process each bracket separately, last-to-first
    return assignPositions(
      getMultiBracketStandings(tournament.battles, brackets),
    );
  }

  // Single bracket (or legacy with no bracket info)
  const format = brackets[0]?.format ?? tournament.format;
  return assignPositions(
    getSingleBracketStandings(tournament.battles, format),
  );
};

// ---------------------------------------------------------------------------
// Qualifying standings
// ---------------------------------------------------------------------------

/** Calculate lap scores for a driver using the tournament's scoring formula. */
const calculateDriverLapScores = (
  driver: TournamentDriver,
  tournament: Tournament,
): number[] => {
  if (!driver.laps || driver.laps.length === 0) return [];

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
 * Get standings based on qualifying results.
 * Uses actual lap scores if available, otherwise falls back to qualifyingPosition.
 */
const getQualifyingStandings = (tournament: Tournament): Standing[] => {
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get standings for a single tournament.
 * Uses battle results if available, otherwise qualifying results.
 */
export const getSingleTournamentStandings = (
  tournament: Tournament,
): Standing[] => {
  if (tournament.battles.length > 0) {
    return getBattleStandings(tournament);
  }

  if (tournament.enableQualifying && tournament.drivers.length > 0) {
    return getQualifyingStandings(tournament);
  }

  return [];
};
