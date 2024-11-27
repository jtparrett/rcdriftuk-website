export const RANKS = {
  UNRANKED: "unranked",
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  DIAMOND: "diamond",
  PLATINUM: "platinum",
} as const;

export const RANKS_RULES = {
  [RANKS.UNRANKED]: "Unranked = < 5 battles",
  [RANKS.BRONZE]: "Bronze = < 1100 points",
  [RANKS.SILVER]: "Silver = 1100 - 1200 points",
  [RANKS.GOLD]: "Gold - 1200 = 1300 points",
  [RANKS.DIAMOND]: "Diamond = 1300 - 1400 points",
  [RANKS.PLATINUM]: "Platinum = 1400+ points",
} as const;

export const getDriverRank = (currentElo: number, totalHistory: number) => {
  if (totalHistory < 5) {
    return RANKS.UNRANKED;
  }

  if (currentElo >= 1400) {
    return RANKS.PLATINUM;
  }

  if (currentElo >= 1300) {
    return RANKS.DIAMOND;
  }

  if (currentElo >= 1200) {
    return RANKS.GOLD;
  }

  if (currentElo >= 1100) {
    return RANKS.SILVER;
  }

  return RANKS.BRONZE;
};
