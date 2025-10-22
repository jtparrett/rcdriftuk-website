import { getAuth } from "~/utils/getAuth.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { z } from "zod";
import { styled, Container } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { CreateTournamentForm } from "~/components/CreateTournamentForm";
import {
  BattlesBracket,
  QualifyingProcedure,
  TicketStatus,
  TournamentsFormat,
  TournamentsState,
} from "~/utils/enums";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { getUsers } from "~/utils/getUsers.server";
import { tournamentFormSchema } from "~/components/CreateTournamentForm";
import { pow2Ceil, pow2Floor } from "~/utils/powFns";
import type { TournamentBattles } from "@prisma/client";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const users = await getUsers();

  const url = new URL(args.request.url);
  const eventId = z.string().nullable().parse(url.searchParams.get("eventId"));
  let eventDrivers: number[] = [];

  if (eventId) {
    const event = await prisma.events.findUnique({
      where: {
        id: eventId,
      },
      include: {
        EventTickets: {
          where: {
            status: TicketStatus.CONFIRMED,
          },
          include: {
            user: {
              select: {
                driverId: true,
              },
            },
          },
        },
      },
    });

    eventDrivers =
      event?.EventTickets.map((ticket) => ticket.user?.driverId ?? 0) ?? [];
  }

  return { users, eventDrivers };
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not not found");

  const body = await args.request.json();

  const {
    name,
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
    driverNumbers,
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

  // Create tournament
  const tournament = await prisma.tournaments.create({
    data: {
      userId,
      name,
      qualifyingLaps,
      format,
      fullInclusion,
      enableProtests,
      region,
      scoreFormula,
      qualifyingOrder,
      qualifyingProcedure,
      driverNumbers,
    },
  });

  // Create judges
  await prisma.tournamentJudges.createMany({
    data: judges.map((judge) => {
      return {
        driverId: Number(judge.driverId),
        tournamentId: tournament.id,
        points: judge.points,
      };
    }),
    skipDuplicates: true,
  });

  // Create new users (not previously registered)
  const driversWithIndex = drivers.map((driver, index) => ({
    ...driver,
    index,
  }));
  const newDrivers = driversWithIndex.filter(
    (driver) => !/^\d+$/.test(driver.driverId),
  );
  let allDrivers = driversWithIndex.filter(
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
      skipDuplicates: true,
    });

    allDrivers = allDrivers
      .concat(
        newDrivers.map((driver, i) => ({
          driverId: newUsers[i].driverId.toString(),
          index: driver.index,
        })),
      )
      .sort((a, b) => a.index - b.index);
  }

  // Create tournament drivers
  const tournamentDrivers = await prisma.tournamentDrivers.createManyAndReturn({
    data: allDrivers.map((driver) => {
      return {
        driverId: Number(driver.driverId),
        tournamentId: tournament.id,
        tournamentDriverNumber: driver.index + 1,
      };
    }),
  });

  // Create qualifying laps
  let nextQualifyingLapId: number | null = null;
  const hasQualifying =
    format !== TournamentsFormat.EXHIBITION &&
    format !== TournamentsFormat.BATTLE_TREE;

  if (hasQualifying) {
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

    nextQualifyingLapId = nextQualifyingLap?.id ?? null;
  }

  // Create battles
  let nextBattleId: number | null = null;
  const totalDrivers = fullInclusion
    ? pow2Ceil(drivers.length)
    : pow2Floor(drivers.length);

  const totalRounds = Math.ceil(Math.log2(totalDrivers)) - 1;

  const makeBattles = async (
    nextUpperBattles: TournamentBattles[],
    nextLowerBattles: TournamentBattles[],
    round: number,
  ) => {
    const totalUpperBattles = nextUpperBattles.length * 2;
    const multiplier = round <= 1 ? 0 : 0.5;
    const totalLowerToCreate =
      tournament.format === TournamentsFormat.DOUBLE_ELIMINATION
        ? Math.ceil(nextUpperBattles.length * multiplier)
        : 0;
    const battleRound = totalRounds + 1 - round;

    const lowerBBattles = await prisma.tournamentBattles.createManyAndReturn({
      data: Array.from(new Array(totalLowerToCreate)).map((_, i) => {
        return {
          round: battleRound,
          tournamentId: tournament.id,
          bracket: BattlesBracket.LOWER,
          winnerNextBattleId: nextLowerBattles[Math.floor(i / 2)]?.id,
        };
      }),
    });

    const lowerABattles = await prisma.tournamentBattles.createManyAndReturn({
      data: Array.from(new Array(totalLowerToCreate * 2)).map((_, i) => {
        return {
          round: battleRound,
          tournamentId: tournament.id,
          bracket: BattlesBracket.LOWER,
          winnerNextBattleId: lowerBBattles[Math.floor(i / 2)]?.id,
        };
      }),
    });

    const lowerBattles = [...lowerBBattles, ...lowerABattles];

    const upperBattles = await prisma.tournamentBattles.createManyAndReturn({
      data: Array.from(new Array(totalUpperBattles)).map((_, i) => {
        return {
          round: battleRound,
          tournamentId: tournament.id,
          bracket: BattlesBracket.UPPER,
          winnerNextBattleId: nextUpperBattles[Math.floor(i / 2)]?.id,
          loserNextBattleId: lowerBattles[Math.floor(i / 2)]?.id,
        };
      }),
    });

    nextBattleId = upperBattles[0].id;

    if (round < totalRounds) {
      await makeBattles(upperBattles, lowerBattles, round + 1);
    }
  };

  const final = await prisma.tournamentBattles.create({
    data: {
      tournamentId: tournament.id,
      round: 1000,
      bracket: BattlesBracket.UPPER,
    },
  });

  await makeBattles([final], [], 1);

  // Update tournament
  await prisma.tournaments.update({
    where: {
      id: tournament.id,
    },
    data: {
      state: nextQualifyingLapId
        ? TournamentsState.QUALIFYING
        : TournamentsState.BATTLES,
      nextQualifyingLapId,
      nextBattleId,
    },
  });

  return redirect(`/tournaments/${tournament.id}/overview`);
};

const Page = () => {
  const { users, eventDrivers } = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={4} py={8}>
      <styled.h1 fontSize="3xl" fontWeight="extrabold" mb={4}>
        New Tournament
      </styled.h1>
      <CreateTournamentForm users={users} eventDrivers={eventDrivers} />
    </Container>
  );
};

export default Page;
