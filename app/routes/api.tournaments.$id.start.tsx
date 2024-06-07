import { TournamentsFormat, TournamentsState } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import { nameStringToArray } from "~/utils/nameStringToArray";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  invariant(userId);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      state: TournamentsState.START,
      event: {
        eventTrack: {
          owners: {
            some: {
              id: userId,
            },
          },
        },
      },
    },
  });

  invariant(tournament);

  const formData = await args.request.formData();
  const drivers = z.string().parse(formData.get("drivers"));
  const judges = z.string().parse(formData.get("judges"));
  const qualifyingLaps = Math.max(
    z.coerce.number().parse(formData.get("qualifyingLaps")),
    1
  );
  const format = z.nativeEnum(TournamentsFormat).parse(formData.get("format"));

  // Create judges
  await prisma.tournamentJudges.createMany({
    data: nameStringToArray(judges).map((name) => {
      return {
        name,
        tournamentId: id,
      };
    }),
  });

  // Create drivers
  const tournamentDrivers = await prisma.tournamentDrivers.createManyAndReturn({
    data: nameStringToArray(drivers).map((name) => {
      return {
        name,
        tournamentId: id,
      };
    }),
  });

  // Create laps
  await prisma.laps.createMany({
    data: tournamentDrivers.flatMap((driver) => {
      return Array.from(new Array(tournament.qualifyingLaps)).map(() => {
        return {
          tournamentDriverId: driver.id,
        };
      });
    }),
  });

  // Get next qualifying lap
  const nextQualifyingLap = await prisma.laps.findFirst({
    where: {
      driver: {
        tournamentId: id,
      },
      scores: {
        none: {},
      },
    },
    orderBy: [
      {
        tournamentDriverId: "asc",
      },
      { id: "asc" },
    ],
  });

  // Update tournament
  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      state: TournamentsState.QUALIFYING,
      nextQualifyingLapId: nextQualifyingLap?.id,
      qualifyingLaps,
      format,
    },
  });

  return redirect(`/tournaments/${id}`);
};
