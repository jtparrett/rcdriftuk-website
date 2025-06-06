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

  // Convert map to array and sort by battle count, win count, and qualifying position
  const sortedDrivers = Array.from(driverMap.values()).sort((a, b) => {
    // First sort by battle count (descending)
    if (
      b.battleCount !== a.battleCount &&
      tournament.format !== TournamentsFormat.DRIFT_WARS
    ) {
      return b.battleCount - a.battleCount;
    }
    // Then sort by win count (descending)
    if (b.winCount !== a.winCount) {
      return b.winCount - a.winCount;
    }
    // Then sort by qualifying position (ascending)
    if ((a.qualifyingPosition ?? 0) !== (b.qualifyingPosition ?? 0)) {
      return (a.qualifyingPosition ?? 0) - (b.qualifyingPosition ?? 0);
    }
    // Finally sort by last name, then first name (ascending)
    return `${a.lastName}${a.firstName}`.localeCompare(
      `${b.lastName}${b.firstName}`,
    );
  });

  return sortedDrivers;
};
