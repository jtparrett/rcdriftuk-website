import { Regions, ScoreFormula, TournamentsFormat } from "./enums";

export const TOURNAMENT_TEMPLATES: Record<
  string,
  {
    region: Regions;
    format: TournamentsFormat;
    scoreFormula: ScoreFormula;
  }
> = {
  driftWars: {
    region: Regions.NA,
    format: TournamentsFormat.EXHIBITION,
    scoreFormula: ScoreFormula.AVERAGED,
  },
  sdc2025: {
    region: Regions.NA,
    format: TournamentsFormat.STANDARD,
    scoreFormula: ScoreFormula.CUMULATIVE,
  },
};
