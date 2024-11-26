export const RANKS = {
  UNRANKED: "unranked",
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  DIAMOND: "diamond",
  PLATINUM: "platinum",
} as const;

export const getDriverRank = (currentElo: number, totalHistory: number) => {
  if (totalHistory < 5) {
    return RANKS.UNRANKED;
  }

  if (currentElo >= 1400) {
    return RANKS.DIAMOND;
  }

  if (currentElo >= 1300) {
    return RANKS.PLATINUM;
  }

  if (currentElo >= 1200) {
    return RANKS.GOLD;
  }

  if (currentElo >= 1100) {
    return RANKS.SILVER;
  }

  return RANKS.BRONZE;
};
