import {
  QualifyingOrder,
  Regions,
  ScoreFormula,
  TournamentsFormat,
} from "./enums";

export const TOURNAMENT_TEMPLATES: Record<
  string,
  {
    region: Regions;
    format: TournamentsFormat;
    scoreFormula: ScoreFormula;
    qualifyingOrder: QualifyingOrder;
  }
> = {
  driftWars: {
    region: Regions.NA,
    format: TournamentsFormat.EXHIBITION,
    scoreFormula: ScoreFormula.AVERAGED,
    qualifyingOrder: QualifyingOrder.DRIVERS,
  },
  sdc2025: {
    region: Regions.NA,
    format: TournamentsFormat.STANDARD,
    scoreFormula: ScoreFormula.CUMULATIVE,
    qualifyingOrder: QualifyingOrder.DRIVERS,
  },
};
