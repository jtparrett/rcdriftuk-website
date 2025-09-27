import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { ConfirmationForm } from "~/components/ConfirmationForm";
import { QualifyingProcedure, TournamentsState } from "~/utils/enums";
import { getAuth } from "~/utils/getAuth.server";
import invariant from "~/utils/invariant";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { tournamentAdvanceQualifying } from "~/utils/tournamentAdvanceQualifying";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  const tournament = await prisma.tournaments.findUnique({
    where: {
      id,
      state: TournamentsState.QUALIFYING,
      userId,
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

  return null;
};

export const action = async (args: ActionFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  const tournament = await prisma.tournaments.findUnique({
    where: {
      id,
      state: TournamentsState.QUALIFYING,
      userId,
    },
    include: {
      nextQualifyingLap: true,
      judges: true,
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

  invariant(
    tournament.qualifyingProcedure === QualifyingProcedure.BEST,
    "Qualifying procedure must be BEST",
  );

  await prisma.lapScores.deleteMany({
    where: {
      judge: {
        tournamentId: id,
      },
    },
  });

  const drivers = await prisma.tournamentDrivers.findMany({
    where: {
      tournamentId: id,
    },
    include: {
      laps: true,
    },
  });

  await prisma.lapScores.createMany({
    data: drivers.flatMap((driver) => {
      return tournament.judges.flatMap((judge) => {
        return driver.laps.flatMap((lap) => {
          return {
            score: Math.floor(Math.random() * judge.points),
            lapId: lap.id,
            judgeId: judge.id,
          };
        });
      });
    }),
  });

  await tournamentAdvanceQualifying(id, true);

  return redirect(`/tournaments/${id}/overview`);
};

const RandomiseQualifyingPage = () => {
  return (
    <ConfirmationForm
      title="Are you sure you want to randomise the qualifying results?"
      confirmText="Yes, Randomise"
      disclaimer="This will randomise the qualifying results for all drivers and allow for random battle pairings to be generated. This will not randomise the order of the drivers in the tournament."
    />
  );
};

export default RandomiseQualifyingPage;
