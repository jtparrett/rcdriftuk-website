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
import invariant from "~/utils/invariant";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { TournamentStartForm } from "~/components/TournamentStartForm";
import {
  AspectRatio,
  Box,
  Center,
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
  RiOpenArmLine,
  RiRemoteControlLine,
  RiShareForwardFill,
  RiShuffleLine,
} from "react-icons/ri";
import type { Route } from "./+types/tournaments.$id";
import { sentenceCase } from "change-case";
import { HiddenEmbed, useIsEmbed } from "~/utils/EmbedContext";
import { Tab } from "~/components/Tab";
import { TabsBar } from "~/components/TabsBar";
import { getUser, type GetUser } from "~/utils/getUser.server";
import { useEffect, useState } from "react";
import pluralize from "pluralize";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  let user: GetUser | null = null;
  const tournament = await getTournament(id, userId);

  if (!tournament) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const users = await getUsers();

  if (userId) {
    user = await getUser(userId);
  }

  const tournamentJudge = tournament.judges.find(
    (judge) => judge.user.id === userId,
  );
  const isBattlingDriver =
    tournament.nextBattle?.driverLeft?.driverId === user?.driverId ||
    tournament.nextBattle?.driverRight?.driverId === user?.driverId;

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
    isBattlingDriver,
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
      nextBattle: {
        select: {
          BattleProtests: {
            where: {
              resolved: false,
            },
            take: 1,
          },
        },
      },
    },
  });

  const publishUpdate = () => {
    createAbly()
      .channels.get(tournament.id)
      .publish("update", new Date().toISOString());
  };

  invariant(
    (tournament.nextBattle?.BattleProtests.length ?? 0) === 0,
    "Protests must be resolved before continuing",
  );

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
  return [
    { title: `RC Drift UK | ${data?.tournament.name}` },
    {
      property: "og:image",
      content: "https://rcdrift.uk/og-image.jpg",
    },
  ];
};

const TournamentPage = () => {
  const { tournament, users, tournamentJudge, eventDrivers, isBattlingDriver } =
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
  const hasProtest = (tournament.nextBattle?.BattleProtests.length ?? 0) > 0;
  const hasUnresolvedProtest =
    tournament.nextBattle?.BattleProtests.some(
      (protest) => !protest.resolved,
    ) ?? false;

  const judgingCompleteForNextBattle =
    (tournament.nextBattle?.BattleVotes.length ?? 0) >=
    tournament.judges.length;
  const judgingCompleteAt = judgingCompleteForNextBattle
    ? tournament.nextBattle?.BattleVotes.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      )[0].updatedAt
    : null;

  const getProtestSecondsRemaining = () => {
    return judgingCompleteAt
      ? Math.max(
          0,
          20 -
            Math.floor(
              (new Date().getTime() - judgingCompleteAt.getTime()) / 1000,
            ),
        )
      : 0;
  };

  const [secondsRemaining, setSecondsRemaining] = useState(
    getProtestSecondsRemaining(),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const protestSecondsRemaining = getProtestSecondsRemaining();
      setSecondsRemaining(protestSecondsRemaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [judgingCompleteAt]);

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

              <Spacer />

              {(tournament.state === TournamentsState.QUALIFYING ||
                tournament.state === TournamentsState.BATTLES) && (
                <styled.span
                  textTransform="uppercase"
                  fontWeight="semibold"
                  fontSize="sm"
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  borderWidth={1}
                  borderColor="gray.800"
                  rounded="md"
                  px={2}
                  py={1}
                >
                  <Box
                    w={2}
                    h={2}
                    rounded="full"
                    bgColor="brand.500"
                    animation="flash 0.7s alternate infinite"
                  />
                  Live
                </styled.span>
              )}

              <Button
                px={2}
                variant="ghost"
                onClick={() => {
                  navigator.share({
                    url: `https://rcdrift.uk/tournaments/${tournament.id}`,
                  });
                }}
              >
                <RiShareForwardFill />
              </Button>
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
            <Container maxW={1100} px={2} my={2}>
              <AspectRatio ratio={16 / 9} rounded="xl" overflow="hidden">
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
            <TabsBar>
              <Tab
                to={`/tournaments/${tournament.id}/overview`}
                isActive={isOverviewTab}
                replace
              >
                Overview
              </Tab>
              {tournament.qualifyingLaps > 0 && (
                <Tab
                  to={`/tournaments/${tournament.id}/qualifying`}
                  isActive={isQualifyingTab}
                  replace
                >
                  Qualifying
                </Tab>
              )}
              <Tab
                to={`/tournaments/${tournament.id}/battles/${BattlesBracket.UPPER}`}
                isActive={isBattlesTab}
                replace
              >
                Battles
              </Tab>
              {(tournament.state === TournamentsState.END ||
                tournament.format === TournamentsFormat.EXHIBITION) && (
                <Tab
                  to={`/tournaments/${tournament.id}/standings`}
                  isActive={isStandingsTab}
                  replace
                >
                  Standings
                </Tab>
              )}
            </TabsBar>

            <Box py={2}>
              <Container maxW={1100} px={2}>
                {hasUnresolvedProtest && isOwner && (
                  <Form
                    method="post"
                    action={`/api/protest/${tournament.nextBattle?.BattleProtests[0].id}/resolve`}
                  >
                    <Box rounded="2xl" p={1} bgColor="brand.900" mb={2}>
                      <Flex
                        p={4}
                        rounded="xl"
                        borderWidth={1}
                        borderColor="brand.600"
                        borderStyle="dashed"
                        alignItems="center"
                        gap={4}
                      >
                        <Center
                          w={10}
                          h={10}
                          bgColor="brand.600"
                          rounded="lg"
                          flex="none"
                        >
                          <RiOpenArmLine size={24} />
                        </Center>
                        <styled.p
                          fontWeight="medium"
                          lineHeight="1.2"
                          maxW="340px"
                          flex={1}
                        >
                          A protest has been raised. It must be resolved before
                          continuing.
                        </styled.p>

                        <Button ml="auto" type="submit">
                          Resolve Protest
                        </Button>
                      </Flex>
                    </Box>
                  </Form>
                )}

                <Flex
                  flexDir={{ base: "column", sm: "row" }}
                  gap={1}
                  overflow="auto"
                  flexWrap="wrap"
                >
                  <Spacer />

                  {isOwner && secondsRemaining > 0 && (
                    <Box
                      rounded="full"
                      borderWidth={1}
                      borderColor="gray.700"
                      bgColor="gray.800"
                      py={1.5}
                      px={4}
                    >
                      <p>
                        Waiting for protests:{" "}
                        {pluralize("second", secondsRemaining, true)} remaining
                      </p>
                    </Box>
                  )}

                  {isOwner &&
                    tournament.state === TournamentsState.BATTLES &&
                    tournament.format === TournamentsFormat.EXHIBITION &&
                    judgingCompleteForNextBattle &&
                    !isOMT &&
                    !hasUnresolvedProtest && (
                      <>
                        <LinkButton
                          to={`/tournaments/${tournament.id}/battles/create`}
                        >
                          Create Next Battle <RiFlagLine />
                        </LinkButton>
                        <LinkButton
                          to={`/tournaments/${tournament.id}/end`}
                          variant="outline"
                        >
                          End Tournament
                        </LinkButton>
                      </>
                    )}

                  {isBattlingDriver &&
                    judgingCompleteForNextBattle &&
                    !location.pathname.includes("/protest") &&
                    !hasProtest && (
                      <LinkButton
                        to={`/tournaments/${tournament.id}/protest`}
                        w={{ base: "full", sm: "auto" }}
                      >
                        Protest Decision <RiOpenArmLine />
                      </LinkButton>
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
                    tournament.state === TournamentsState.QUALIFYING && (
                      <LinkButton
                        variant="outline"
                        to={`/tournaments/${tournament.id}/randomise`}
                      >
                        Randomise Qualifying <RiShuffleLine />
                      </LinkButton>
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
                    tournament.format !== TournamentsFormat.EXHIBITION &&
                    !hasUnresolvedProtest &&
                    secondsRemaining <= 0 && (
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
