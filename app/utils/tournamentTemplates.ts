import { Regions, TournamentsFormat } from "./enums";

export const TOURNAMENT_TEMPLATES: Record<
  string,
  {
    region: Regions;
    format: TournamentsFormat;
  }
> = {
  driftWars: {
    region: Regions.NA,
    format: TournamentsFormat.EXHIBITION,
  },
  sdc2025: {
    region: Regions.NA,
    format: TournamentsFormat.STANDARD,
  },
};
