import { TournamentGrades } from "@prisma/client";

export const getKRatingFromGrade = (grade: TournamentGrades) => {
  switch (grade) {
    case TournamentGrades.MAJOR:
      return 48;
    case TournamentGrades.REGIONAL:
      return 38;
    case TournamentGrades.CLUB:
      return 16;
  }
};
