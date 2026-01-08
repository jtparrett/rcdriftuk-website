import { getAuth } from "~/utils/getAuth.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { z } from "zod";
import { styled, Container } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { CreateTournamentForm } from "~/components/CreateTournamentForm";
import {
  BattlesBracket,
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
    throw redirect("/sign-in");
  }

  const users = await getUsers();

  const url = new URL(args.request.url);
  const tournamentId = z
    .string()
    .nullable()
    .parse(url.searchParams.get("tournamentId"));

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

    return { users, tournament };
  }

  return { users };
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not not found");

  const body = await args.request.json();

  const {
    name,
    enableQualifying,
    enableBattles,
    judges,
    qualifyingLaps,
    format,
    enableProtests,
    region,
    scoreFormula,
    qualifyingOrder,
    bracketSize,
    driverNumbers,
    ratingRequested,
  } = tournamentFormSchema.parse(body);

  // Create tournament
  const tournament = await prisma.tournaments.create({
    data: {
      userId,
      name,
      enableQualifying,
      enableBattles,
      qualifyingLaps,
      format,
      bracketSize,
      enableProtests,
      region,
      scoreFormula,
      qualifyingOrder,
      driverNumbers,
      ratingRequested,
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

  // Create battles
  let nextBattleId: number | null = null;
  const totalRounds = Math.ceil(Math.log2(tournament.bracketSize)) - 1;

  let grandFinal: TournamentBattles | null = null;
  let lowerFinal: TournamentBattles | null = null;

  if (tournament.enableBattles) {
    await prisma.tournamentBattles.deleteMany({
      where: {
        tournamentId: tournament.id,
      },
    });

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
  }

  // Update tournament
  await prisma.tournaments.update({
    where: {
      id: tournament.id,
    },
    data: {
      state: TournamentsState.REGISTRATION,
      nextBattleId,
    },
  });

  return redirect(`/tournaments/${tournament.id}/registration`);
};

const Page = () => {
  const { users, tournament } = useLoaderData<typeof loader>();

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
            enableQualifying: tournament?.enableQualifying,
            enableBattles: tournament?.enableBattles,
            ratingRequested: tournament?.ratingRequested,
          }}
        />
      </Container>
    </>
  );
};

export default Page;
