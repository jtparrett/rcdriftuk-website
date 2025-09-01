import { TournamentsFormat, BattlesBracket } from "./enums";

type Driver = {
  isBye: boolean;
  id: number;
  qualifyingPosition: number | null;
  user: {
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    driverId: number;
  };
};

type Battle = {
  winnerId: number | null;
  tournament: {
    format: TournamentsFormat;
  };
  driverLeft: Driver | null;
  driverRight: Driver | null;
  bracket?: string;
  round?: number;
};

type DriverStats = {
  id: number;
  driverId: number;
  firstName: string | null;
  lastName: string | null;
  battleCount: number;
  winCount: number;
  qualifyingPosition: number | null;
  image: string | null;
};

export const getTournamentStandings = (battles: Battle[]) => {
  if (battles.length === 0) {
    return [];
  }

  const tournament = battles[0].tournament;
  const driverMap = new Map<number, DriverStats>();

  // Helper function to process a driver
  const processDriver = (driver: Driver, isWinner: boolean) => {
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
        battleCount: 1,
        winCount: isWinner ? 1 : 0,
        qualifyingPosition: driver.qualifyingPosition,
        image: driver.user.image,
      });
    }
  };

  // Process all battles to build driver stats
  battles.forEach((battle) => {
    if (battle.driverLeft) {
      processDriver(
        battle.driverLeft,
        battle.winnerId === battle.driverLeft.id,
      );
    }
    if (battle.driverRight) {
      processDriver(
        battle.driverRight,
        battle.winnerId === battle.driverRight.id,
      );
    }
  });

  const allDrivers = Array.from(driverMap.values());

  // Helper function for standard driver sorting
  const sortDrivers = (drivers: DriverStats[]) => {
    return drivers.sort((a, b) => {
      // Then by win count (descending)
      if (b.winCount !== a.winCount) {
        return b.winCount - a.winCount;
      }
      // Then by qualifying position (ascending, null treated as high value)
      const aQualPos = a.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
      const bQualPos = b.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;

      if (aQualPos !== bQualPos) {
        return aQualPos - bQualPos;
      }
      // Finally by name (ascending)
      return `${a.lastName}${a.firstName}`.localeCompare(
        `${b.lastName}${b.firstName}`,
      );
    });
  };

  // For other formats, handle special top positions
  const finalStandings: DriverStats[] = [];
  const remainingDrivers = [...allDrivers];

  // Helper function to move driver from remaining to final standings
  const moveDriverToStandings = (driverId: number | null | undefined) => {
    if (!driverId) return false;
    const index = remainingDrivers.findIndex((d) => d.id === driverId);
    if (index === -1) return false;
    finalStandings.push(remainingDrivers.splice(index, 1)[0]);
    return true;
  };

  // Find final battle (round 1000) and determine 1st and 2nd place
  const finalBattleIndex = battles.findIndex((battle) => battle.round === 1000);
  const finalBattle = battles[finalBattleIndex];

  // Confirm it's a single tournament and not a leaderboard
  // Note: leaderboards should not include rounds on battles
  if (finalBattleIndex !== -1) {
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
      // Find final lower bracket battle for 3rd/4th place
      const lowerBracketBattles = battles.filter(
        (battle) =>
          battle.bracket === BattlesBracket.LOWER && battle.winnerId !== null,
      );

      if (lowerBracketBattles.length > 0) {
        const finalLowerBattle = lowerBracketBattles.reduce(
          (latest, current) =>
            (current.round || 0) > (latest.round || 0) ? current : latest,
        );

        if (finalLowerBattle.winnerId) {
          // 3rd place: winner of final lower bracket battle
          moveDriverToStandings(finalLowerBattle.winnerId);

          // 4th place: loser of final lower bracket battle
          const lowerLoserId =
            finalLowerBattle.driverLeft?.id === finalLowerBattle.winnerId
              ? finalLowerBattle.driverRight?.id
              : finalLowerBattle.driverLeft?.id;

          moveDriverToStandings(lowerLoserId);
        }
      }
    } else {
      // For standard format, use second-to-last battle for 3rd place
      const semiFinalBattle = battles[finalBattleIndex - 1];

      if (semiFinalBattle?.winnerId) {
        moveDriverToStandings(semiFinalBattle.winnerId);
      }
    }
  }

  // Sort remaining drivers and combine with final standings
  return [...finalStandings, ...sortDrivers(remainingDrivers)];
};
