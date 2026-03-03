const REGIONAL_KEYS = ["UK", "EU", "NA", "ZA", "LA", "AP"] as const;

type RegionalEloFields = {
  elo_UK: number;
  elo_EU: number;
  elo_NA: number;
  elo_ZA: number;
  elo_LA: number;
  elo_AP: number;
};

export type BestRegionalElo = {
  bestElo: number;
  bestRegion: (typeof REGIONAL_KEYS)[number];
};

export const getBestRegionalElo = (driver: RegionalEloFields): BestRegionalElo => {
  let bestElo = -Infinity;
  let bestRegion: (typeof REGIONAL_KEYS)[number] = "UK";

  for (const region of REGIONAL_KEYS) {
    const elo = driver[`elo_${region}`];
    if (elo > bestElo) {
      bestElo = elo;
      bestRegion = region;
    }
  }

  return { bestElo, bestRegion };
};
