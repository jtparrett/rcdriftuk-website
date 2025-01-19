import type { Values } from "./values";

export const RANKS = {
  UNRANKED: "unranked",
  STEEL: "steel",
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  DIAMOND: "diamond",
  PLATINUM: "platinum",
} as const;

export const RANKS_RULES = {
  [RANKS.UNRANKED]: "Unranked = < 5 battles",
  [RANKS.STEEL]: "Steel <= 1050 points",
  [RANKS.BRONZE]: "Bronze = 1050 - 1100 points",
  [RANKS.SILVER]: "Silver = 1100 - 1200 points",
  [RANKS.GOLD]: "Gold = 1200 = 1300 points",
  [RANKS.DIAMOND]: "Diamond = 1300 - 1400 points",
  [RANKS.PLATINUM]: "Platinum = 1400+ points",
} as const;

export const getRankColor = (rank: Values<typeof RANKS>): [string, string] => {
  switch (rank) {
    case RANKS.UNRANKED:
      return ["#12161D", "#0B0E13"];
    case RANKS.STEEL:
      return ["#242D3A", "#151A23"];
    case RANKS.BRONZE:
      return ["#3E2A0B", "#2C1D07"];
    case RANKS.SILVER:
      return ["#3A4049", "#2A2F36"];
    case RANKS.GOLD:
      return ["#856d3d", "#644f25"];
    case RANKS.DIAMOND:
      return ["#102B45", "#0C1F31"];
    case RANKS.PLATINUM:
      return ["#2B3B4D", "#1E2A38"];
    default:
      return ["#070809", "#050506"];
  }
};

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

  if (currentElo >= 1050) {
    return RANKS.BRONZE;
  }

  return RANKS.STEEL;
};
