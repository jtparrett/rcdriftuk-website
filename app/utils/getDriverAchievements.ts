import type { getDriverRatings } from "~/utils/getDriverRatings";

type DriverRatings = Awaited<ReturnType<typeof getDriverRatings>>;

export const getDriverAchievements = (
  driverRatings?: DriverRatings[number]
) => {
  const achievements: string[] = [];

  // 2024 champion
  const is2024Champion =
    (driverRatings?.history.filter(
      (battle) =>
        battle.battle?.tournament === "2024-FINAL" &&
        battle.elo > battle.startingElo
    )?.length ?? 0) >= 5;
  if (is2024Champion) {
    achievements.push("2024-champion.png");
  }

  return achievements;
};
