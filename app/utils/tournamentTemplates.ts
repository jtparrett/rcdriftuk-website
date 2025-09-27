import {
  QualifyingOrder,
  QualifyingProcedure,
  Regions,
  ScoreFormula,
  TournamentsDriverNumbers,
  TournamentsFormat,
} from "./enums";

export const TOURNAMENT_TEMPLATES: Record<
  string,
  {
    region: Regions;
    format: TournamentsFormat;
    scoreFormula: ScoreFormula;
    qualifyingOrder: QualifyingOrder;
    qualifyingProcedure: QualifyingProcedure;
    driverNumbers: TournamentsDriverNumbers;
  }
> = {
  driftWars: {
    region: Regions.NA,
    format: TournamentsFormat.EXHIBITION,
    scoreFormula: ScoreFormula.AVERAGED,
    qualifyingOrder: QualifyingOrder.DRIVERS,
    qualifyingProcedure: QualifyingProcedure.BEST,
    driverNumbers: TournamentsDriverNumbers.NONE,
  },
  sdc2025: {
    region: Regions.NA,
    format: TournamentsFormat.STANDARD,
    scoreFormula: ScoreFormula.CUMULATIVE,
    qualifyingOrder: QualifyingOrder.DRIVERS,
    qualifyingProcedure: QualifyingProcedure.BEST,
    driverNumbers: TournamentsDriverNumbers.TOURNAMENT,
  },
};
