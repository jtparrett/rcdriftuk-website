import { useUser } from "@clerk/react-router";
import { BattlesBracket, TicketStatus, TournamentsState } from "~/utils/enums";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useNavigation,
} from "react-router";
import { AblyProvider, ChannelProvider } from "ably/react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { TournamentStartForm } from "~/components/TournamentStartForm";
import {
  AspectRatio,
  Box,
  Container,
  Flex,
  Spacer,
  styled,
} from "~/styled-system/jsx";
import { createAbly } from "~/utils/ably.server";
import { ably as AblyClient } from "~/utils/ably";
import { getAuth } from "~/utils/getAuth.server";
import { getTournament } from "~/utils/getTournament.server";
import { getUsers } from "~/utils/getUsers.server";
import { prisma } from "~/utils/prisma.server";
import { tournamentEndQualifying } from "~/utils/tournamentEndQualifying";
import { tournamentNextBattle } from "~/utils/tournamentNextBattle";
import { useAblyRealtimeReloader } from "~/utils/useAblyRealtimeReloader";
import { useReloader } from "~/utils/useReloader";
import { RiFlagLine, RiRemoteControlLine } from "react-icons/ri";
import { Spinner } from "~/components/Spinner";
import type { Route } from "./+types/tournaments.$id";

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

  const tournamentJudge = tournament.judges.find(
    (judge) => judge.user.id === userId,
  );

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

  return {
    tournament,
    users,
    tournamentJudge,
    eventDrivers,
  };
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

  const publishUpdate = () => {
    createAbly()
      .channels.get(tournament.id)
      .publish("update", new Date().toISOString());
  };

  if (
    tournament.state === TournamentsState.QUALIFYING &&
    tournament.nextQualifyingLapId === null
  ) {
    await tournamentEndQualifying(id);
    publishUpdate();
    return redirect(`/tournaments/${id}/qualifying`);
  }

  if (tournament.state === TournamentsState.QUALIFYING) {
    invariant(
      tournament?.judges.length ===
        tournament?.nextQualifyingLap?.scores.length,
      "Judging not complete for current lap",
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

    publishUpdate();
  }

  if (tournament.state === TournamentsState.BATTLES) {
    await tournamentNextBattle(id);

    publishUpdate();

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
      `/tournaments/${id}/battles/${nextBattle?.nextBattle?.bracket ?? BattlesBracket.UPPER}`,
    );
  }

  return redirect(`/tournaments/${id}/qualifying`);
};

export const meta: Route.MetaFunction = ({ data }) => {
  return [{ title: `RC Drift UK | ${data?.tournament.name}` }];
};

const TournamentPage = () => {
  const { tournament, users, tournamentJudge, eventDrivers } =
    useLoaderData<typeof loader>();
  const location = useLocation();
  const transition = useNavigation();
  const isLoading =
    transition.state === "submitting" || transition.state === "loading";
  const isSubmitting = transition.state === "submitting";
  const isOverviewTab = location.pathname.includes("overview");
  const isQualifyingTab = location.pathname.includes("qualifying");
  const isBattlesTab = location.pathname.includes("battles");
  const isStandingsTab = location.pathname.includes("standings");
  const { user } = useUser();

  const isOwner = user?.id === tournament.userId;

  useReloader();
  useAblyRealtimeReloader(tournament.id);

  return (
    <>
      <Box py={2} borderBottomWidth={1} borderColor="gray.900">
        <Container maxW={1100} px={2}>
          <styled.h1
            fontSize="xl"
            fontWeight="bold"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {tournament.name}
          </styled.h1>
        </Container>
      </Box>

      {tournament.liveUrl && (
        <Box borderBottomWidth={1} borderColor="gray.900">
          <Container maxW={1100} px={2} mt={4}>
            <AspectRatio ratio={16 / 9} rounded="xl" overflow="hidden" mb={4}>
              <styled.iframe src={tournament.liveUrl} />
            </AspectRatio>
          </Container>
        </Box>
      )}

      {tournament.state === TournamentsState.START && (
        <Container maxW={1100} px={2} py={4}>
          <TournamentStartForm
            tournament={tournament}
            users={users}
            eventDrivers={eventDrivers}
          />
        </Container>
      )}

      {tournament.state !== TournamentsState.START && (
        <>
          <Box py={2} borderBottomWidth={1} borderColor="gray.900" mb={4}>
            <Container maxW={1100} px={2}>
              <Flex
                flexDir={{ base: "column", sm: "row" }}
                gap={1}
                overflow="auto"
              >
                <Flex
                  bgColor="gray.900"
                  rounded="full"
                  gap={1}
                  p={1}
                  w="fit-content"
                >
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
                  {tournament.state === TournamentsState.END && (
                    <LinkButton
                      to={`/tournaments/${tournament.id}/standings`}
                      variant={isStandingsTab ? "secondary" : "ghost"}
                      size="xs"
                    >
                      Standings
                    </LinkButton>
                  )}
                </Flex>

                <Spacer />

                {isOwner &&
                  tournament.state === TournamentsState.QUALIFYING &&
                  tournament.nextQualifyingLap &&
                  tournament.nextQualifyingLap.scores.length ===
                    tournament.judges.length &&
                  tournament.nextQualifyingLap && (
                    <Form method="post">
                      <Button
                        type="submit"
                        w={{ base: "full", sm: "auto" }}
                        disabled={isLoading}
                        color={isSubmitting ? "transparent" : undefined}
                      >
                        {isSubmitting && <Spinner />}
                        Start Next Run <RiFlagLine />
                      </Button>
                    </Form>
                  )}

                {isOwner &&
                  tournament.state === TournamentsState.QUALIFYING &&
                  tournament.nextQualifyingLap === null && (
                    <Form method="post">
                      <Button
                        type="submit"
                        w={{ base: "full", sm: "auto" }}
                        disabled={isLoading}
                        color={isSubmitting ? "transparent" : undefined}
                      >
                        {isSubmitting && <Spinner />}
                        End Qualifying
                      </Button>
                    </Form>
                  )}

                {isOwner &&
                  tournament.state === TournamentsState.BATTLES &&
                  (tournament.nextBattle?.BattleVotes.length ?? 0) >=
                    tournament.judges.length && (
                    <Form method="post">
                      <Button
                        type="submit"
                        w={{ base: "full", sm: "auto" }}
                        disabled={isLoading}
                        color={isSubmitting ? "transparent" : undefined}
                      >
                        {isSubmitting && <Spinner />}
                        Start Next Battle <RiFlagLine />
                      </Button>
                    </Form>
                  )}

                {tournamentJudge && (
                  <LinkButton
                    to={`/judge/${tournamentJudge.id}`}
                    variant="outline"
                  >
                    Open Judges Remote <RiRemoteControlLine />
                  </LinkButton>
                )}
              </Flex>
            </Container>
          </Box>

          <Container pb={12} px={2} maxW={1100}>
            <Outlet />
          </Container>
        </>
      )}
    </>
  );
};

export default () => {
  const { tournament } = useLoaderData<typeof loader>();

  return (
    <AblyProvider client={AblyClient}>
      <ChannelProvider channelName={tournament.id}>
        <TournamentPage />
      </ChannelProvider>
    </AblyProvider>
  );
};
