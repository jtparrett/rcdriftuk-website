import { TournamentsDriverNumbers } from "~/utils/enums";

interface DriverWithNumber {
  user: { driverId: number };
  tournamentDriverNumber: number | null;
}

export const getDriverNumber = (
  driver: DriverWithNumber | null | undefined,
  driverNumbers: string,
): number | undefined => {
  if (!driver || driverNumbers === TournamentsDriverNumbers.NONE) {
    return undefined;
  }

  if (driverNumbers === TournamentsDriverNumbers.UNIVERSAL) {
    return driver.user.driverId;
  }

  return driver.tournamentDriverNumber ?? undefined;
};
