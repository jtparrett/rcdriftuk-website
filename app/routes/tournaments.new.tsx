import { getAuth } from "~/utils/getAuth.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { z } from "zod";
import { styled, Container } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { CreateTournamentForm } from "~/components/CreateTournamentForm";
import {
  BattlesBracket,
  TicketStatus,
  TournamentsFormat,
  TournamentsState,
} from "~/utils/enums";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { getUsers } from "~/utils/getUsers.server";
import { tournamentFormSchema } from "~/components/CreateTournamentForm";
import type { TournamentBattles } from "@prisma/client";
import { TabsBar } from "~/components/TabsBar";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in");
  }

  const users = await getUsers();

  const url = new URL(args.request.url);
  const eventId = z.string().nullable().parse(url.searchParams.get("eventId"));
  const tournamentId = z
    .string()
    .nullable()
    .parse(url.searchParams.get("tournamentId"));

  if (eventId) {
    const eventDrivers = await prisma.eventTickets.findMany({
      where: {
        eventId,
        status: TicketStatus.CONFIRMED,
      },
      select: {
        user: {
          select: {
            driverId: true,
          },
        },
      },
    });

    const drivers = eventDrivers.map((driver) => ({
      driverId: driver.user?.driverId?.toString() ?? "",
    }));

    return { users, drivers };
  }

  if (tournamentId) {
    const tournament = await prisma.tournaments.findUnique({
      where: {
        id: tournamentId,
      },
      include: {
        judges: {
          select: {
            driverId: true,
            points: true,
          },
        },
        drivers: {
          where: {
            driverId: {
              not: 0,
            },
          },
          select: {
            driverId: true,
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    const drivers =
      tournament?.drivers.map((driver) => ({
        driverId: driver.driverId.toString(),
      })) ?? [];

    return { users, drivers, tournament };
  }

  return { users };
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
    enableProtests,
    region,
    scoreFormula,
    qualifyingOrder,
    bracketSize,
    driverNumbers,
  } = tournamentFormSchema.parse(body);

  if (drivers.length < 4) {
    throw new Error(`Please add at least 4 drivers to the tournament`);
  }

  // Create tournament
  const tournament = await prisma.tournaments.create({
    data: {
      userId,
      name,
      qualifyingLaps,
      format,
      bracketSize,
      enableProtests,
      region,
      scoreFormula,
      qualifyingOrder,
      driverNumbers,
    },
  });

  // Create judges
  await prisma.$transaction([
    prisma.tournamentJudges.deleteMany({
      where: {
        tournamentId: tournament.id,
      },
    }),
    prisma.tournamentJudges.createMany({
      data: judges.map((judge) => {
        return {
          driverId: Number(judge.driverId),
          tournamentId: tournament.id,
          points: judge.points,
        };
      }),
      skipDuplicates: true,
    }),
  ]);

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
          firstName: firstName?.trim() ?? "",
          lastName: lastName?.trim() ?? "",
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
  const [_, tournamentDrivers] = await prisma.$transaction([
    prisma.tournamentDrivers.deleteMany({
      where: {
        tournamentId: tournament.id,
      },
    }),
    prisma.tournamentDrivers.createManyAndReturn({
      data: allDrivers.map((driver) => {
        return {
          driverId: Number(driver.driverId),
          tournamentId: tournament.id,
          tournamentDriverNumber: driver.index + 1,
        };
      }),
    }),
  ]);

  // Create qualifying laps
  let nextQualifyingLapId: number | null = null;

  if (tournament.enableQualifying) {
    const [_, [nextQualifyingLap]] = await prisma.$transaction([
      prisma.laps.deleteMany({
        where: {
          tournament: {
            id: tournament.id,
          },
        },
      }),
      prisma.laps.createManyAndReturn({
        data: Array.from({ length: qualifyingLaps }).flatMap((_, i) => {
          return tournamentDrivers.map((driver) => {
            return {
              tournamentDriverId: driver.id,
              round: i + 1,
            };
          });
        }),
      }),
    ]);

    nextQualifyingLapId = nextQualifyingLap?.id ?? null;
  }

  // Create battles
  await prisma.tournamentBattles.deleteMany({
    where: {
      tournamentId: tournament.id,
    },
  });

  let nextBattleId: number | null = null;
  const totalRounds = Math.ceil(Math.log2(tournament.bracketSize)) - 1;

  let grandFinal: TournamentBattles | null = null;
  let lowerFinal: TournamentBattles | null = null;

  if (tournament.format === TournamentsFormat.DOUBLE_ELIMINATION) {
    grandFinal = await prisma.tournamentBattles.create({
      data: {
        tournamentId: tournament.id,
        round: 1002,
        bracket: BattlesBracket.UPPER,
      },
    });

    lowerFinal = await prisma.tournamentBattles.create({
      data: {
        tournamentId: tournament.id,
        round: 1001,
        bracket: BattlesBracket.LOWER,
        winnerNextBattleId: grandFinal?.id,
      },
    });
  }

  // Create the playoff battle
  let playoffBattle: TournamentBattles | null = null;
  if (tournament.format === TournamentsFormat.STANDARD) {
    playoffBattle = await prisma.tournamentBattles.create({
      data: {
        tournamentId: tournament.id,
        round: totalRounds + 1,
        bracket: BattlesBracket.UPPER,
      },
    });
  }

  const upperFinal = await prisma.tournamentBattles.create({
    data: {
      tournamentId: tournament.id,
      round: 1000,
      bracket: BattlesBracket.UPPER,
      winnerNextBattleId: grandFinal?.id,
      loserNextBattleId: lowerFinal?.id,
    },
  });

  nextBattleId = upperFinal.id;

  const makeBattles = async (
    nextUpperBattles: TournamentBattles[],
    nextLowerBattles: TournamentBattles[],
    round: number,
  ) => {
    const totalUpperBattles = nextUpperBattles.length * 2;
    const battleRound = totalRounds + 1 - round;
    const isFirstRound = round === totalRounds;

    const totalLowerDropInToCreate =
      tournament.format === TournamentsFormat.DOUBLE_ELIMINATION &&
      !isFirstRound
        ? totalUpperBattles
        : 0;

    const lowerDropInBattles =
      await prisma.tournamentBattles.createManyAndReturn({
        data: Array.from(new Array(totalLowerDropInToCreate)).map((_, i) => {
          return {
            round: battleRound,
            tournamentId: tournament.id,
            bracket: BattlesBracket.LOWER,
          };
        }),
      });

    const totalLowerConsolidationToCreate =
      tournament.format === TournamentsFormat.DOUBLE_ELIMINATION
        ? totalUpperBattles / 2
        : 0;

    const lowerConsolidationBattles =
      await prisma.tournamentBattles.createManyAndReturn({
        data: Array.from(new Array(totalLowerConsolidationToCreate)).map(
          (_, i) => {
            return {
              round: battleRound,
              tournamentId: tournament.id,
              bracket: BattlesBracket.LOWER,
              winnerNextBattleId: nextLowerBattles[i]?.id,
            };
          },
        ),
      });

    // I don't like this update
    // But it's needed so the running order is correct
    await prisma.$transaction(
      lowerDropInBattles.map((battle, i) => {
        return prisma.tournamentBattles.update({
          where: {
            id: battle.id,
          },
          data: {
            winnerNextBattleId:
              lowerConsolidationBattles[Math.floor(i / 2)]?.id,
          },
        });
      }),
    );

    // Upper battles
    const upperBattles = await prisma.tournamentBattles.createManyAndReturn({
      data: Array.from(new Array(totalUpperBattles)).map((_, i) => {
        let loserNextBattleId = isFirstRound
          ? lowerConsolidationBattles[Math.floor(i / 2)]?.id
          : lowerDropInBattles[totalUpperBattles - 1 - i]?.id;

        if (playoffBattle && round === 1) {
          loserNextBattleId = playoffBattle?.id;
        }

        return {
          round: battleRound,
          tournamentId: tournament.id,
          bracket: BattlesBracket.UPPER,
          winnerNextBattleId: nextUpperBattles[Math.floor(i / 2)]?.id,
          loserNextBattleId,
        };
      }),
    });

    nextBattleId = upperBattles[0].id;

    if (!isFirstRound && round !== totalRounds * 2) {
      await makeBattles(upperBattles, lowerDropInBattles, round + 1);
    }
  };

  await makeBattles([upperFinal], lowerFinal ? [lowerFinal] : [], 1);

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
  const { users, drivers, tournament } = useLoaderData<typeof loader>();

  return (
    <>
      <TabsBar>
        <styled.h1 fontSize="lg" fontWeight="extrabold">
          New Tournament
        </styled.h1>
      </TabsBar>

      <Container maxW={1100} px={2} py={4}>
        <CreateTournamentForm
          users={users}
          initialValues={{
            drivers,
            name: tournament?.name,
            judges: tournament?.judges.map((judge) => ({
              driverId: judge.driverId.toString(),
              points: judge.points,
            })),
            format: tournament?.format,
            bracketSize: tournament?.bracketSize,
            enableProtests: tournament?.enableProtests,
            qualifyingLaps: tournament?.qualifyingLaps,
            region: tournament?.region ?? undefined,
            scoreFormula: tournament?.scoreFormula,
            qualifyingOrder: tournament?.qualifyingOrder,
            driverNumbers: tournament?.driverNumbers,
          }}
        />
      </Container>
    </>
  );
};

export default Page;
