import type { Values } from "./values";

export const AppName = "RC Drift International";

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
  EXHIBITION: "EXHIBITION",
  WILDCARD: "WILDCARD",
} as const;

export type TournamentsFormat = Values<typeof TournamentsFormat>;

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
  CUMULATIVE: "CUMULATIVE",
  AVERAGED: "AVERAGED",
} as const;

export type ScoreFormula = Values<typeof ScoreFormula>;

export const LeaderboardType = {
  TOURNAMENTS: "TOURNAMENTS",
  DRIVERS: "DRIVERS",
} as const;

export type LeaderboardType = Values<typeof LeaderboardType>;
