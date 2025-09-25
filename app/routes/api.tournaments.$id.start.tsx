import {
  Regions,
  TournamentsFormat,
  TournamentsState,
  ScoreFormula,
  QualifyingOrder,
  QualifyingProcedure,
} from "~/utils/enums";
import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import invariant from "~/utils/invariant";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const tournamentFormSchema = z.object({
  judges: z
    .array(
      z.object({
        driverId: z.string(),
        points: z.coerce.number(),
      }),
    )
    .min(1, "Please add at least one judge to the tournament"),
  drivers: z
    .array(
      z.object({
        driverId: z.string(),
      }),
    )
    .min(4, "Please add at least four drivers to the tournament"),
  qualifyingLaps: z.coerce
    .number()
    .min(1, "Qualifying laps must be at least 1")
    .max(3, "Qualifying laps must be at most 3"),
  format: z.nativeEnum(TournamentsFormat),
  fullInclusion: z.boolean(),
  enableProtests: z.boolean(),
  region: z.nativeEnum(Regions),
  scoreFormula: z.nativeEnum(ScoreFormula),
  qualifyingOrder: z.nativeEnum(QualifyingOrder),
  qualifyingProcedure: z.nativeEnum(QualifyingProcedure),
});

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

  const body = await args.request.json();

  const {
    judges,
    drivers,
    qualifyingLaps,
    format,
    fullInclusion,
    enableProtests,
    region,
    scoreFormula,
    qualifyingOrder,
    qualifyingProcedure,
  } = tournamentFormSchema.parse(body);

  if (
    fullInclusion || format === TournamentsFormat.EXHIBITION
      ? drivers.length < 2
      : drivers.length < 4
  ) {
    throw new Error(
      `Please add at least ${fullInclusion ? 2 : 4} drivers to the tournament`,
    );
  }

  // Create judges
  await prisma.tournamentJudges.createMany({
    data: judges.map((judge) => {
      return {
        driverId: Number(judge.driverId),
        tournamentId: id,
        points: judge.points,
      };
    }),
    skipDuplicates: true,
  });

  // Create drivers
  const newDrivers = drivers.filter((driver) => !/^\d+$/.test(driver.driverId));
  let allDrivers = drivers.filter(
    (driver) => !newDrivers.some((d) => d.driverId === driver.driverId),
  );

  if (newDrivers.length > 0) {
    const newUsers = await prisma.users.createManyAndReturn({
      data: newDrivers.map((driver) => {
        const [firstName, lastName] = driver.driverId.split(" ");

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
      newUsers.map((user) => ({
        driverId: user.driverId.toString(),
      })),
    );
  }

  const tournamentDrivers = await prisma.tournamentDrivers.createManyAndReturn({
    data: allDrivers.map((driver) => {
      return {
        driverId: Number(driver.driverId),
        tournamentId: id,
      };
    }),
    skipDuplicates: true,
  });

  const isExhibition = format === TournamentsFormat.EXHIBITION;

  if (isExhibition) {
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
  const totalLapsToCreate =
    qualifyingProcedure === QualifyingProcedure.WAVES ? 1 : qualifyingLaps;

  const [nextQualifyingLap] = await prisma.laps.createManyAndReturn({
    data: Array.from({ length: totalLapsToCreate }).flatMap((_, i) => {
      return tournamentDrivers.map((driver) => {
        return {
          tournamentDriverId: driver.id,
          round: i + 1,
        };
      });
    }),
  });

  // Update tournament
  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      state: TournamentsState.QUALIFYING,
      nextQualifyingLapId: nextQualifyingLap?.id,
      qualifyingOrder,
      qualifyingLaps,
      format,
      fullInclusion,
      enableProtests,
      region,
      scoreFormula,
      qualifyingProcedure,
    },
  });

  return redirect(`/tournaments/${id}/overview`);
};
