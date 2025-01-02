import { useUser } from "@clerk/remix";
import { BattlesBracket, TournamentsState } from "@prisma/client";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import {
  Form,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { TournamentStartForm } from "~/components/TournamentStartForm";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getTournament } from "~/utils/getTournament.server";
import { getUsers } from "~/utils/getUsers.server";
import { prisma } from "~/utils/prisma.server";
import { tournamentEndQualifying } from "~/utils/tournamentEndQualifying";
import { tournamentNextBattle } from "~/utils/tournamentNextBattle";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  const tournament = await getTournament(id, userId);

  if (!tournament) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const users = await getUsers();

  const tournamentJudge = await prisma.tournamentJudges.findFirst({
    where: {
      user: {
        id: userId,
      },
      tournamentId: id,
    },
  });

  return { tournament, users, tournamentJudge };
};

export const action = async (args: ActionFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  invariant(userId);

  const tournament = await prisma.tournaments.findFirstOrThrow({
    where: {
      id,
      userId,
    },
    include: {
      judges: true,
      nextQualifyingLap: {
        include: {
          scores: true,
        },
      },
    },
  });

  if (
    tournament.state === TournamentsState.QUALIFYING &&
    tournament.nextQualifyingLapId === null
  ) {
    await tournamentEndQualifying(id);
    return redirect(`/tournaments/${id}/qualifying`);
  }

  if (tournament.state === TournamentsState.QUALIFYING) {
    invariant(
      tournament?.judges.length ===
        tournament?.nextQualifyingLap?.scores.length,
      "Judging not complete for current lap"
    );

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

    await prisma.tournaments.update({
      where: {
        id,
      },
      data: {
        nextQualifyingLapId: nextQualifyingLap?.id ?? null,
      },
    });
  }

  if (tournament.state === TournamentsState.BATTLES) {
    await tournamentNextBattle(id);
    const nextBattle = await prisma.tournaments.findFirst({
      where: {
        id,
      },
      select: {
        nextBattle: {
          select: {
            bracket: true,
          },
        },
      },
    });

    return redirect(
      `/tournaments/${id}/battles/${nextBattle?.nextBattle?.bracket ?? BattlesBracket.UPPER}`
    );
  }

  return redirect(`/tournaments/${id}/qualifying`);
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `RC Drift UK | ${data?.tournament.name}` }];
};

const TournamentPage = () => {
  const { tournament, users, tournamentJudge } = useLoaderData<typeof loader>();
  const location = useLocation();
  const isOverviewTab = location.pathname.includes("overview");
  const isQualifyingTab = location.pathname.includes("qualifying");
  const isBattlesTab = location.pathname.includes("battles");
  const { user } = useUser();

  const isOwner = user?.id === tournament.userId;

  return (
    <Container pb={12} px={2} pt={8} maxW={1100}>
      {/* <AspectRatio ratio={16 / 9} rounded="xl" overflow="hidden" mb={4}>
        <styled.iframe src="https://www.youtube.com/embed/MQkZalwQ_XU?si=LMqIJ_Q96b6LUlRZ" />
      </AspectRatio> */}

      <Box mb={4}>
        <styled.h1
          fontSize="3xl"
          fontWeight="extrabold"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {tournament.name}
        </styled.h1>
      </Box>

      {tournament.state === TournamentsState.START && (
        <TournamentStartForm tournament={tournament} users={users} />
      )}

      {tournament.state !== TournamentsState.START && (
        <>
          <Flex mb={4} flexDir={{ base: "column", sm: "row" }} gap={2}>
            <Flex bgColor="gray.900" rounded="xl" gap={1} p={1}>
              <LinkButton
                to={`/tournaments/${tournament.id}/overview`}
                size="xs"
                variant={isOverviewTab ? "secondary" : "ghost"}
              >
                Overview
              </LinkButton>
              <LinkButton
                to={`/tournaments/${tournament.id}/qualifying`}
                variant={isQualifyingTab ? "secondary" : "ghost"}
                size="xs"
              >
                Qualifying
              </LinkButton>
              <LinkButton
                to={`/tournaments/${tournament.id}/battles/${BattlesBracket.UPPER}`}
                variant={isBattlesTab ? "secondary" : "ghost"}
                size="xs"
              >
                Battles
              </LinkButton>
            </Flex>

            <Spacer />

            {isOwner &&
              tournament.state === TournamentsState.QUALIFYING &&
              tournament.nextQualifyingLap &&
              tournament.nextQualifyingLap.scores.length ===
                tournament.judges.length &&
              tournament.nextQualifyingLap && (
                <Form method="post">
                  <Button type="submit">Start Next Run</Button>
                </Form>
              )}

            {isOwner &&
              tournament.state === TournamentsState.QUALIFYING &&
              tournament.nextQualifyingLap === null && (
                <Form method="post">
                  <Button type="submit">End Qualifying</Button>
                </Form>
              )}

            {isOwner &&
              tournament.state === TournamentsState.BATTLES &&
              (tournament.nextBattle?.BattleVotes.length ?? 0) >=
                tournament.judges.length && (
                <Form method="post">
                  <Button type="submit">Start Next Battle</Button>
                </Form>
              )}

            {tournamentJudge && (
              <LinkButton to={`/judge/${tournamentJudge.id}`}>
                Open Judging
              </LinkButton>
            )}
          </Flex>

          <Outlet />
        </>
      )}
    </Container>
  );
};

export default TournamentPage;
