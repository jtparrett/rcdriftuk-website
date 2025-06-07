import { TournamentsFormat } from "./enums";

export const getTournamentStandings = (
  battles: {
    winnerId: number | null;
    tournament: {
      format: TournamentsFormat;
    };
    driverLeft: {
      isBye: boolean;
      id: number;
      qualifyingPosition: number | null;
      user: {
        firstName: string | null;
        lastName: string | null;
        image: string | null;
        driverId: number;
      };
    } | null;
    driverRight: {
      isBye: boolean;
      id: number;
      qualifyingPosition: number | null;
      user: {
        firstName: string | null;
        lastName: string | null;
        image: string | null;
        driverId: number;
      };
    } | null;
  }[],
) => {
  if (battles.length === 0) {
    return [];
  }

  const tournament = battles[0].tournament;

  // Create a map to track unique drivers and their battle counts
  const driverMap: Map<
    number,
    {
      id: number;
      driverId: number;
      firstName: string | null;
      lastName: string | null;
      battleCount: number;
      winCount: number;
      qualifyingPosition: number | null;
      image: string | null;
    }
  > = new Map();

  // Loop through battles to count appearances and store qualifying positions
  battles.forEach((battle) => {
    const leftDriver = battle.driverLeft;
    const rightDriver = battle.driverRight;

    if (leftDriver && !leftDriver.isBye) {
      // Process left driver
      if (!driverMap.has(leftDriver.id)) {
        driverMap.set(leftDriver.id, {
          id: leftDriver.id,
          driverId: leftDriver.user.driverId,
          firstName: leftDriver.user.firstName,
          lastName: leftDriver.user.lastName,
          battleCount: 1,
          winCount: battle.winnerId === leftDriver.id ? 1 : 0,
          qualifyingPosition: leftDriver.qualifyingPosition,
          image: leftDriver.user.image,
        });
      } else {
        const driver = driverMap.get(leftDriver.id);
        if (driver) {
          driver.battleCount++;
          if (battle.winnerId === leftDriver.id) {
            driver.winCount++;
          }
        }
      }
    }

    if (rightDriver && !rightDriver.isBye) {
      // Process right driver
      if (!driverMap.has(rightDriver.id)) {
        driverMap.set(rightDriver.id, {
          id: rightDriver.id,
          driverId: rightDriver.user.driverId,
          firstName: rightDriver.user.firstName,
          lastName: rightDriver.user.lastName,
          battleCount: 1,
          winCount: battle.winnerId === rightDriver.id ? 1 : 0,
          qualifyingPosition: rightDriver.qualifyingPosition,
          image: rightDriver.user.image,
        });
      } else {
        const driver = driverMap.get(rightDriver.id);
        if (driver) {
          driver.battleCount++;
          if (battle.winnerId === rightDriver.id) {
            driver.winCount++;
          }
        }
      }
    }
  });

  // Convert map to array
  const allDrivers = Array.from(driverMap.values());

  // For drift_wars format, use standard sorting for all positions
  if (tournament.format === TournamentsFormat.DRIFT_WARS) {
    return allDrivers.sort((a, b) => {
      // Sort by battle count (descending)
      if (b.battleCount !== a.battleCount) {
        return b.battleCount - a.battleCount;
      }
      // Then sort by win count (descending)
      if (b.winCount !== a.winCount) {
        return b.winCount - a.winCount;
      }
      // Then sort by qualifying position (ascending, null treated as high value)
      const aQualPos = a.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
      const bQualPos = b.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
      if (aQualPos !== bQualPos) {
        return aQualPos - bQualPos;
      }
      // Finally sort by name (ascending)
      return `${a.lastName}${a.firstName}`.localeCompare(
        `${b.lastName}${b.firstName}`,
      );
    });
  }

  // For other formats, handle special top 3 positions
  const finalStandings: typeof allDrivers = [];
  const remainingDrivers = [...allDrivers];

  // Find last battle (final)
  const lastBattle = battles[battles.length - 1];
  if (lastBattle && lastBattle.winnerId) {
    // First place: winner of last battle
    const winnerIndex = remainingDrivers.findIndex(
      (d) => d.id === lastBattle.winnerId,
    );
    if (winnerIndex !== -1) {
      finalStandings.push(remainingDrivers.splice(winnerIndex, 1)[0]);
    }

    // Second place: loser of last battle
    const loserId =
      lastBattle.driverLeft?.id === lastBattle.winnerId
        ? lastBattle.driverRight?.id
        : lastBattle.driverLeft?.id;

    if (loserId) {
      const loserIndex = remainingDrivers.findIndex((d) => d.id === loserId);
      if (loserIndex !== -1) {
        finalStandings.push(remainingDrivers.splice(loserIndex, 1)[0]);
      }
    }
  }

  // Find second to last battle (semi-final)
  if (battles.length >= 2) {
    const secondLastBattle = battles[battles.length - 2];
    if (secondLastBattle && secondLastBattle.winnerId) {
      // Third place: winner of second to last battle (if not already placed)
      const semiWinnerIndex = remainingDrivers.findIndex(
        (d) => d.id === secondLastBattle.winnerId,
      );
      if (semiWinnerIndex !== -1) {
        finalStandings.push(remainingDrivers.splice(semiWinnerIndex, 1)[0]);
      }
    }
  }

  // Sort remaining drivers by standard criteria
  const sortedRemainingDrivers = remainingDrivers.sort((a, b) => {
    // Sort by battle count (descending)
    if (b.battleCount !== a.battleCount) {
      return b.battleCount - a.battleCount;
    }
    // Then sort by win count (descending)
    if (b.winCount !== a.winCount) {
      return b.winCount - a.winCount;
    }
    // Then sort by qualifying position (ascending, null treated as high value)
    const aQualPos = a.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
    const bQualPos = b.qualifyingPosition ?? Number.MAX_SAFE_INTEGER;
    if (aQualPos !== bQualPos) {
      return aQualPos - bQualPos;
    }
    // Finally sort by name (ascending)
    return `${a.lastName}${a.firstName}`.localeCompare(
      `${b.lastName}${b.firstName}`,
    );
  });

  // Combine final standings with remaining drivers
  return [...finalStandings, ...sortedRemainingDrivers];
};
