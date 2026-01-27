import type { Values } from "./values";

export const AppName = "RCDIO";

export const TrackTypes = {
  ALL: "ALL",
  TRACKS: "TRACKS",
  CLUBS: "CLUBS",
  SHOPS: "SHOPS",
} as const;

export type TrackTypes = Values<typeof TrackTypes>;

export const ProductStatus = {
  IN_STOCK: "IN_STOCK",
  SOLD_OUT: "SOLD_OUT",
  BACKORDER: "BACKORDER",
  UNKNOWN: "UNKNOWN",
} as const;

export type ProductStatus = Values<typeof ProductStatus>;

export const TournamentsState = {
  START: "START",
  QUALIFYING: "QUALIFYING",
  BATTLES: "BATTLES",
  END: "END",
} as const;

export type TournamentsState = Values<typeof TournamentsState>;

export const TournamentsFormat = {
  STANDARD: "STANDARD",
  DOUBLE_ELIMINATION: "DOUBLE_ELIMINATION",
} as const;

export type TournamentsFormat = Values<typeof TournamentsFormat>;

export const JudgingInterface = {
  SIMPLE: "SIMPLE",
  ADVANCED: "ADVANCED",
} as const;

export type JudgingInterface = Values<typeof JudgingInterface>;

export const BattlesBracket = {
  UPPER: "UPPER",
  LOWER: "LOWER",
} as const;

export type BattlesBracket = Values<typeof BattlesBracket>;

export const TrackStatus = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  PENDING: "PENDING",
  CLOSED: "CLOSED",
} as const;

export type TrackStatus = Values<typeof TrackStatus>;

export const TicketStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export type TicketStatus = Values<typeof TicketStatus>;

export const Regions = {
  ALL: "ALL",
  UK: "UK",
  EU: "EU",
  NA: "NA",
  ZA: "ZA",
  LA: "LA",
  AP: "AP",
} as const;

export type Regions = Values<typeof Regions>;

export const ScoreFormula = {
  SUM: "SUM",
  AVERAGE: "AVERAGE",
  HEAD_JUDGE_1: "HEAD_JUDGE_1",
  HEAD_JUDGE_2: "HEAD_JUDGE_2",
  HEAD_JUDGE_3: "HEAD_JUDGE_3",
  // Legacy values for backward compatibility
  CUMULATIVE: "CUMULATIVE",
  AVERAGED: "AVERAGED",
} as const;

export type ScoreFormula = Values<typeof ScoreFormula>;

/**
 * Gets the available score formula options based on the number of judges
 */
export const getScoreFormulaOptions = (
  judgeCount: number,
  judgeNames?: string[],
): { value: ScoreFormula; label: string; formula: string }[] => {
  // Always use sequential letters A, B, C, etc. for the formula
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  if (judgeCount <= 0) {
    return [];
  }

  if (judgeCount === 1) {
    return [
      {
        value: ScoreFormula.SUM,
        label: "Standard",
        formula: letters[0],
      },
    ];
  }

  if (judgeCount === 2) {
    const [a, b] = letters;
    return [
      {
        value: ScoreFormula.SUM,
        label: "Sum",
        formula: `${a} + ${b}`,
      },
      {
        value: ScoreFormula.AVERAGE,
        label: "Average",
        formula: `(${a} + ${b}) / 2`,
      },
    ];
  }

  if (judgeCount === 3) {
    const [a, b, c] = letters;
    // Use judge names for labels if provided, otherwise use letters
    const nameA = judgeNames?.[0] ?? a;
    const nameB = judgeNames?.[1] ?? b;
    const nameC = judgeNames?.[2] ?? c;
    return [
      {
        value: ScoreFormula.SUM,
        label: "Sum",
        formula: `${a} + ${b} + ${c}`,
      },
      {
        value: ScoreFormula.AVERAGE,
        label: "Average",
        formula: `(${a} + ${b} + ${c}) / 3`,
      },
      {
        value: ScoreFormula.HEAD_JUDGE_3,
        label: `Head Judge (${nameC})`,
        formula: `((${a} + ${b}) / 2) + ${c}`,
      },
      {
        value: ScoreFormula.HEAD_JUDGE_2,
        label: `Head Judge (${nameB})`,
        formula: `((${a} + ${c}) / 2) + ${b}`,
      },
      {
        value: ScoreFormula.HEAD_JUDGE_1,
        label: `Head Judge (${nameA})`,
        formula: `((${b} + ${c}) / 2) + ${a}`,
      },
    ];
  }

  // 4+ judges - only average
  const allLetters = letters.slice(0, judgeCount).join(" + ");
  return [
    {
      value: ScoreFormula.AVERAGE,
      label: "Average",
      formula: `(${allLetters}) / ${judgeCount}`,
    },
  ];
};

export const LeaderboardType = {
  TOURNAMENTS: "TOURNAMENTS",
  DRIVERS: "DRIVERS",
} as const;

export type LeaderboardType = Values<typeof LeaderboardType>;

export const QualifyingOrder = {
  DRIVERS: "DRIVERS",
  RUNS: "RUNS",
} as const;

export type QualifyingOrder = Values<typeof QualifyingOrder>;

export const TournamentsDriverNumbers = {
  NONE: "NONE",
  UNIVERSAL: "UNIVERSAL",
  TOURNAMENT: "TOURNAMENT",
} as const;

export type TournamentsDriverNumbers = Values<typeof TournamentsDriverNumbers>;

export const BracketSize = {
  TOP_4: 4,
  TOP_8: 8,
  TOP_16: 16,
  TOP_32: 32,
  TOP_64: 64,
  TOP_128: 128,
};

export type BracketSize = Values<typeof BracketSize>;
