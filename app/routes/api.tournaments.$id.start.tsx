import { TournamentsFormat, TournamentsState } from "@prisma/client";
import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import invariant from "tiny-invariant";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  invariant(userId);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      state: TournamentsState.START,
    },
  });

  invariant(tournament);

  const formData = await args.request.formData();
  const judges = z.array(z.string()).parse(formData.getAll("judges"));
  const drivers = z.array(z.string()).parse(formData.getAll("drivers"));
  const qualifyingLaps = Math.max(
    z.coerce.number().parse(formData.get("qualifyingLaps")),
    1
  );
  const format = z.nativeEnum(TournamentsFormat).parse(formData.get("format"));
  const fullInclusion =
    z.string().parse(formData.get("fullInclusion")) === "true";

  invariant(judges.length > 0, "Please add at least one judge");
  invariant(drivers.length > 1, "Please add at least 2 drivers");

  // Create judges
  await prisma.tournamentJudges.createMany({
    data: judges.map((judgeId) => {
      return {
        driverId: Number(judgeId),
        tournamentId: id,
      };
    }),
  });

  // Create drivers
  const tournamentDrivers = await prisma.tournamentDrivers.createManyAndReturn({
    data: drivers.map((driverId) => {
      return {
        driverId: Number(driverId),
        tournamentId: id,
      };
    }),
  });

  // Create laps
  await prisma.laps.createMany({
    data: tournamentDrivers.flatMap((driver) =>
      Array.from({ length: qualifyingLaps }, () => ({
        tournamentDriverId: driver.id,
      }))
    ),
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
      fullInclusion,
    },
  });

  return redirect(`/tournaments/${id}/overview`);
};
