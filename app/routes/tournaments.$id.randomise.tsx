import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { ConfirmationForm } from "~/components/ConfirmationForm";
import { TournamentsState } from "~/utils/enums";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

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

  notFoundInvariant(tournament);

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
  });

  notFoundInvariant(tournament);

  await prisma.lapScores.deleteMany({
    where: {
      judge: {
        tournamentId: id,
      },
    },
  });

  const judges = await prisma.tournamentJudges.findMany({
    where: {
      tournamentId: id,
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
      return judges.flatMap((judge) => {
        return driver.laps.flatMap((lap) => {
          return {
            score: Math.floor(Math.random() * 100),
            lapId: lap.id,
            judgeId: judge.id,
          };
        });
      });
    }),
  });

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      nextQualifyingLapId: null,
    },
  });

  return redirect(`/tournaments/${id}/qualifying`);
};

const RandomiseQualifyingPage = () => {
  return (
    <ConfirmationForm
      title="Are you sure you want to randomise qualifying?"
      confirmText="Yes, Randomise"
      disclaimer="This will randomise the qualifying results for all drivers and allow for random battle pairings to be generated."
    />
  );
};

export default RandomiseQualifyingPage;
