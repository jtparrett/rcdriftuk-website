import { TournamentGrades } from "@prisma/client";

export const getKRatingFromGrade = (grade: TournamentGrades) => {
  switch (grade) {
    case TournamentGrades.MAJOR:
      return 50;
    case TournamentGrades.REGIONAL:
      return 42;
    case TournamentGrades.CLUB:
      return 16;
  }
};
