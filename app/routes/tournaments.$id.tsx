import { useUser } from "@clerk/react-router";
import {
  BattlesBracket,
  TicketStatus,
  TournamentsFormat,
  TournamentsState,
} from "~/utils/enums";
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
import {
  RiFlagLine,
  RiFullscreenFill,
  RiRemoteControlLine,
} from "react-icons/ri";
import type { Route } from "./+types/tournaments.$id";
import { sentenceCase } from "change-case";
import { HiddenEmbed, useIsEmbed } from "~/utils/EmbedContext";
import { Tab } from "~/components/Tab";

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

  invariant(userId, "User not found");

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
  const isEmbed = useIsEmbed();
  const isLoading =
    transition.state === "submitting" || transition.state === "loading";
  const isSubmitting = transition.state === "submitting";
  const isOverviewTab = location.pathname.includes("overview");
  const isQualifyingTab = location.pathname.includes("qualifying");
  const isBattlesTab = location.pathname.includes("battles");
  const isStandingsTab = location.pathname.includes("standings");
  const { user } = useUser();

  const isOwner = user?.id === tournament.userId;

  const winThreshold = Math.floor(tournament.judges.length / 2 + 1);

  const leftVotes =
    tournament.nextBattle?.BattleVotes.filter(
      (vote) => vote.winnerId === tournament.nextBattle?.driverLeftId,
    ) ?? [];
  const rightVotes =
    tournament.nextBattle?.BattleVotes.filter(
      (vote) => vote.winnerId === tournament.nextBattle?.driverRightId,
    ) ?? [];

  const isOMT =
    leftVotes.length < winThreshold && rightVotes.length < winThreshold;

  const judgingCompleteForNextBattle =
    (tournament.nextBattle?.BattleVotes.length ?? 0) >=
    tournament.judges.length;

  useReloader();
  useAblyRealtimeReloader(tournament.id);

  return (
    <>
      <HiddenEmbed>
        <Box py={2} borderBottomWidth={1} borderColor="gray.900">
          <Container maxW={1100} px={2}>
            <Flex alignItems="center" gap={2}>
              <styled.h1
                fontSize="xl"
                fontWeight="bold"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {tournament.name}
              </styled.h1>
              <styled.span
                fontSize="sm"
                fontWeight="medium"
                borderWidth={1}
                rounded="full"
                borderColor="gray.700"
                px={2}
                color="gray.600"
                display="block"
                whiteSpace="nowrap"
              >
                {sentenceCase(tournament.format)}
              </styled.span>
              <Spacer />
              <LinkButton
                to={location.pathname + "?embed=true"}
                px={2}
                target="_blank"
                variant="ghost"
              >
                <RiFullscreenFill />
              </LinkButton>
            </Flex>
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
      </HiddenEmbed>

      {tournament.state === TournamentsState.START && (
        <Container maxW={1100} px={4}>
          <TournamentStartForm
            tournament={tournament}
            users={users}
            eventDrivers={eventDrivers}
          />
        </Container>
      )}

      {tournament.state !== TournamentsState.START && (
        <>
          <HiddenEmbed>
            <Box py={2} borderBottomWidth={1} borderColor="gray.900" mb={4}>
              <Container maxW={1100} px={2}>
                <Flex
                  flexDir={{ base: "column", sm: "row" }}
                  gap={1}
                  overflow="auto"
                  flexWrap="wrap"
                >
                  <Flex gap={0.5} w="fit-content">
                    <Tab
                      to={`/tournaments/${tournament.id}/overview`}
                      isActive={isOverviewTab}
                    >
                      Overview
                    </Tab>
                    {tournament.qualifyingLaps > 0 && (
                      <Tab
                        to={`/tournaments/${tournament.id}/qualifying`}
                        isActive={isQualifyingTab}
                      >
                        Qualifying
                      </Tab>
                    )}
                    <Tab
                      to={`/tournaments/${tournament.id}/battles/${BattlesBracket.UPPER}`}
                      isActive={isBattlesTab}
                    >
                      Battles
                    </Tab>
                    {(tournament.state === TournamentsState.END ||
                      tournament.format === TournamentsFormat.DRIFT_WARS) && (
                      <Tab
                        to={`/tournaments/${tournament.id}/standings`}
                        isActive={isStandingsTab}
                      >
                        Standings
                      </Tab>
                    )}
                  </Flex>

                  <Spacer />

                  {isOwner &&
                    tournament.state === TournamentsState.BATTLES &&
                    tournament.format === TournamentsFormat.DRIFT_WARS &&
                    judgingCompleteForNextBattle &&
                    !isOMT && (
                      <>
                        <LinkButton
                          to={`/tournaments/${tournament.id}/battles/create`}
                        >
                          Next Battle <RiFlagLine />
                        </LinkButton>
                        <LinkButton
                          to={`/tournaments/${tournament.id}/end`}
                          variant="outline"
                        >
                          End Tournament
                        </LinkButton>
                      </>
                    )}

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
                          disabled={isLoading || isSubmitting}
                          isLoading={isSubmitting}
                        >
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
                          disabled={isLoading || isSubmitting}
                          isLoading={isSubmitting}
                        >
                          End Qualifying
                        </Button>
                      </Form>
                    )}

                  {isOwner &&
                    tournament.state === TournamentsState.BATTLES &&
                    judgingCompleteForNextBattle &&
                    tournament.format !== TournamentsFormat.DRIFT_WARS && (
                      <Form method="post">
                        <Button
                          type="submit"
                          w={{ base: "full", sm: "auto" }}
                          disabled={isLoading || isSubmitting}
                          isLoading={isSubmitting}
                        >
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
          </HiddenEmbed>

          {isEmbed ? (
            <Outlet />
          ) : (
            <Container pb={12} px={2} maxW={1100}>
              <Outlet />
            </Container>
          )}
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
