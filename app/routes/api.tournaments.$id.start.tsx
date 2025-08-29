import {
  Regions,
  TournamentsFormat,
  TournamentsState,
  ScoreFormula,
} from "~/utils/enums";
import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import invariant from "~/utils/invariant";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  invariant(userId, "User not found");

  const tournament = await prisma.tournaments.findFirst({
    where: {
      state: TournamentsState.START,
    },
  });

  invariant(tournament, "Tournament not found");

  const formData = await args.request.formData();

  const judges = z.array(z.string()).parse(formData.getAll("judges"));
  const drivers = z.array(z.string()).parse(formData.getAll("drivers"));

  const qualifyingLaps = z.coerce
    .number()
    .min(1, "Qualifying laps must be at least 1")
    .parse(formData.get("qualifyingLaps") || 1);
  const format = z.nativeEnum(TournamentsFormat).parse(formData.get("format"));
  const fullInclusion =
    z.string().parse(formData.get("fullInclusion") || "false") === "true";
  const region = z.nativeEnum(Regions).parse(formData.get("region"));
  const scoreFormula = z
    .nativeEnum(ScoreFormula)
    .parse(formData.get("scoreFormula") || ScoreFormula.CUMULATIVE);

  if (judges.length <= 0) {
    throw new Error("Please add at least one judge to the tournament");
  }

  if (
    fullInclusion || format === TournamentsFormat.DRIFT_WARS
      ? drivers.length < 2
      : drivers.length < 4
  ) {
    throw new Error(
      `Please add at least ${fullInclusion ? 2 : 4} drivers to the tournament`,
    );
  }

  // Create judges
  await prisma.tournamentJudges.createMany({
    data: judges.map((judgeId) => {
      return {
        driverId: Number(judgeId),
        tournamentId: id,
      };
    }),
    skipDuplicates: true,
  });

  // Create drivers
  const newDrivers = drivers.filter((driverId) => !/^\d+$/.test(driverId));
  let allDrivers = drivers.filter((driverId) => !newDrivers.includes(driverId));

  if (newDrivers.length > 0) {
    const newUsers = await prisma.users.createManyAndReturn({
      data: newDrivers.map((driverId) => {
        const [firstName, lastName] = driverId.split(" ");

        if (!firstName?.trim() || !lastName?.trim()) {
          throw new Error(
            `Invalid driver name: "${driverId}". Please provide both first and last name.`,
          );
        }

        return {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        };
      }),
      select: {
        driverId: true,
      },
    });

    allDrivers = allDrivers.concat(
      newUsers.map((user) => user.driverId.toString()),
    );
  }

  const tournamentDrivers = await prisma.tournamentDrivers.createManyAndReturn({
    data: allDrivers.map((driverId) => {
      return {
        driverId: Number(driverId),
        tournamentId: id,
      };
    }),
  });

  const isDriftWars = format === TournamentsFormat.DRIFT_WARS;

  if (isDriftWars) {
    const nextBattle = await prisma.tournamentBattles.create({
      data: {
        tournamentId: id,
        round: 1,
        driverLeftId: tournamentDrivers[0].id,
        driverRightId: tournamentDrivers[1].id,
      },
    });

    await prisma.tournaments.update({
      where: {
        id,
      },
      data: {
        state: TournamentsState.BATTLES,
        qualifyingLaps: 0,
        format,
        nextBattleId: nextBattle.id,
        scoreFormula,
      },
    });

    return redirect(`/tournaments/${id}/overview`);
  }

  // Create laps
  await prisma.laps.createMany({
    data: tournamentDrivers.flatMap((driver) =>
      Array.from({ length: qualifyingLaps }, () => ({
        tournamentDriverId: driver.id,
      })),
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
      region,
      scoreFormula,
    },
  });

  return redirect(`/tournaments/${id}/overview`);
};
