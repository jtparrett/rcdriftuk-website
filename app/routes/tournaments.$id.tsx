import { useUser } from "@clerk/react-router";
import { BattlesBracket, TournamentsState } from "~/utils/enums";
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
import { prisma } from "~/utils/prisma.server";
import { tournamentAdvanceBattles } from "~/utils/tournamentAdvanceBattles";
import { useAblyRealtimeReloader } from "~/utils/useAblyRealtimeReloader";
import { useReloader } from "~/utils/useReloader";
import {
  RiBubbleChartLine,
  RiCheckboxCircleFill,
  RiExchangeLine,
  RiFlagLine,
  RiFullscreenFill,
  RiOpenArmLine,
  RiRemoteControlLine,
  RiSettings2Line,
  RiShareForwardFill,
  RiShieldCheckLine,
  RiShuffleLine,
  RiSwordLine,
} from "react-icons/ri";
import type { Route } from "./+types/tournaments.$id";
import { HiddenEmbed, useIsEmbed } from "~/utils/EmbedContext";
import { Tab } from "~/components/Tab";
import { TabsBar } from "~/components/TabsBar";
import { getUser, type GetUser } from "~/utils/getUser.server";
import { useEffect, useState } from "react";
import pluralize from "pluralize";
import { AppName } from "~/utils/enums";
import { tournamentAdvanceQualifying } from "~/utils/tournamentAdvanceQualifying";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { DashedLine } from "~/components/DashedLine";
import { tournamentSeedBattles } from "~/utils/tournamentSeedBattles";
import { tournamentStart } from "~/utils/tournamentStart";
import { setQualifyingPositions } from "~/utils/setQualifyingPositions";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);
  const tournament = await getTournament(id);

  notFoundInvariant(tournament, "Tournament not found");

  let isJudge = false;
  let isBattlingDriver = false;

  if (userId) {
    const user = await getUser(userId);

    isJudge =
      tournament.judges.find((judge) => judge.user.id === userId) !== undefined;

    isBattlingDriver =
      tournament.nextBattle?.driverLeft?.driverId === user?.driverId ||
      tournament.nextBattle?.driverRight?.driverId === user?.driverId;
  }

  return {
    tournament,
    isJudge,
    isBattlingDriver,
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);
  const referer =
    args.request.headers.get("Referer") ?? `/tournaments/${id}/overview`;

  notFoundInvariant(userId, "User not found");

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      nextQualifyingLap: true,
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
    createAbly(process.env.VITE_ABLY_API_KEY!)
      .channels.get(id)
      .publish("update", new Date().toISOString());
  };

  notFoundInvariant(tournament, "Tournament not found");

  invariant(
    (tournament.nextBattle?.BattleProtests.length ?? 0) === 0,
    "Protests must be resolved before continuing",
  );

  // Handle START state - transition to QUALIFYING or BATTLES
  if (tournament.state === TournamentsState.START) {
    await tournamentStart(id);

    publishUpdate();

    return redirect(referer);
  }

  if (
    tournament.state === TournamentsState.QUALIFYING &&
    tournament.nextQualifyingLapId !== null
  ) {
    await tournamentAdvanceQualifying(id);

    publishUpdate();

    return redirect(referer);
  }

  if (
    tournament.state === TournamentsState.QUALIFYING &&
    tournament.nextQualifyingLapId === null
  ) {
    // Set qualifying positions for all drivers before transitioning
    await setQualifyingPositions(id);

    if (tournament.enableBattles) {
      // Enter battles state
      await tournamentSeedBattles(id);

      await prisma.tournaments.update({
        where: {
          id,
        },
        data: {
          state: TournamentsState.BATTLES,
        },
      });

      publishUpdate();

      return redirect(referer);
    } else {
      await prisma.tournaments.update({
        where: {
          id,
        },
        data: {
          state: TournamentsState.END,
        },
      });
    }
  }

  if (
    tournament.state === TournamentsState.BATTLES &&
    tournament.nextBattleId !== null
  ) {
    await tournamentAdvanceBattles(id);

    publishUpdate();
  }

  if (
    tournament.state === TournamentsState.BATTLES &&
    tournament.nextBattleId === null
  ) {
    await prisma.tournaments.update({
      where: {
        id,
      },
      data: {
        state: TournamentsState.END,
      },
    });
  }

  return redirect(referer);
};

export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: `${AppName} | ${data?.tournament.name}` },
    {
      property: "og:image",
      content: "https://rcdrift.io/og-image.jpg",
    },
  ];
};

const TournamentPage = () => {
  const { tournament, isJudge, isBattlingDriver } =
    useLoaderData<typeof loader>();
  const location = useLocation();
  const transition = useNavigation();
  const isEmbed = useIsEmbed();
  const isLoading =
    transition.state === "submitting" || transition.state === "loading";
  const isSubmitting = transition.state === "submitting";

  const isSetupTab = location.pathname.includes("setup");
  const isJudgeTab = location.pathname.includes("judge");
  const isOverviewTab = location.pathname.includes("overview");
  const isQualifyingTab = location.pathname.includes("qualifying");
  const isBattlesTab = location.pathname.includes("battles");
  const isStandingsTab = location.pathname.includes("standings");

  const { user } = useUser();

  const isOwner = user?.id === tournament.userId;
  const protestingEnabled = tournament.enableProtests;
  const hasProtest = (tournament.nextBattle?.BattleProtests.length ?? 0) > 0;
  const hasUnresolvedProtest =
    tournament.nextBattle?.BattleProtests.some(
      (protest) => !protest.resolved,
    ) ?? false;

  const judgingCompleteForNextBattle =
    tournament.nextBattle === null ||
    (tournament.nextBattle?.BattleVotes.length ?? 0) >=
      tournament.judges.length;
  const judgingCompleteAt = judgingCompleteForNextBattle
    ? tournament.nextBattle?.BattleVotes.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      )[0]?.updatedAt
    : null;

  const getProtestSecondsRemaining = () => {
    if (!tournament.enableProtests) {
      return 0;
    }

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
                fontSize="lg"
                fontWeight="extrabold"
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
                    url: `https://rcdrift.io/tournaments/${tournament.id}`,
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

      <HiddenEmbed>
        <TabsBar>
          {isOwner && (
            <Tab
              to={`/tournaments/${tournament.id}/setup`}
              isActive={isSetupTab}
              data-replace="true"
              replace
            >
              <RiSettings2Line />
              Setup
            </Tab>
          )}

          {isJudge && (
            <Tab
              to={`/tournaments/${tournament.id}/judge`}
              isActive={isJudgeTab}
              data-replace="true"
              replace
            >
              <RiRemoteControlLine />
              Judge
            </Tab>
          )}

          <Tab
            to={`/tournaments/${tournament.id}/overview`}
            isActive={isOverviewTab}
            data-replace="true"
            replace
          >
            <RiBubbleChartLine />
            Overview
          </Tab>

          {tournament.enableQualifying && (
            <Tab
              to={`/tournaments/${tournament.id}/qualifying/0`}
              isActive={isQualifyingTab}
              data-replace="true"
              replace
            >
              <RiShieldCheckLine />
              Qualifying
            </Tab>
          )}
          {tournament.enableBattles && (
            <Tab
              to={`/tournaments/${tournament.id}/battles/${BattlesBracket.UPPER}`}
              isActive={isBattlesTab}
              data-replace="true"
              replace
            >
              <RiSwordLine />
              Battles
            </Tab>
          )}
          {tournament.state === TournamentsState.END && (
            <Tab
              to={`/tournaments/${tournament.id}/standings`}
              isActive={isStandingsTab}
              data-replace="true"
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

              {!tournament.rated &&
                tournament.ratingRequested &&
                tournament.state === TournamentsState.END && (
                  <Flex
                    alignSelf="center"
                    color="brand.500"
                    py={1.5}
                    pl={4}
                    pr={2.5}
                    borderWidth={1}
                    borderColor="brand.500"
                    rounded="full"
                    gap={2}
                    alignItems="center"
                  >
                    <styled.p fontWeight="medium" fontSize="sm">
                      Rating Pending
                    </styled.p>
                    <RiExchangeLine />
                  </Flex>
                )}

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

              {isBattlingDriver &&
                protestingEnabled &&
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

              {isOwner && tournament.state === TournamentsState.START && (
                <Form method="post">
                  <Button
                    type="submit"
                    w={{ base: "full", sm: "auto" }}
                    disabled={isLoading || isSubmitting}
                    isLoading={isSubmitting}
                  >
                    Start Tournament <RiCheckboxCircleFill />
                  </Button>
                </Form>
              )}

              {isOwner && tournament.state === TournamentsState.QUALIFYING && (
                <LinkButton
                  variant="outline"
                  to={`/tournaments/${tournament.id}/randomise`}
                >
                  Randomise <RiShuffleLine />
                </LinkButton>
              )}

              {isOwner &&
                tournament.state === TournamentsState.QUALIFYING &&
                tournament.nextQualifyingLap &&
                tournament.nextQualifyingLap.scores.length ===
                  tournament.judges.length && (
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
                !hasUnresolvedProtest &&
                secondsRemaining <= 0 && (
                  <Form method="post">
                    <Button
                      type="submit"
                      w={{ base: "full", sm: "auto" }}
                      disabled={isLoading || isSubmitting}
                      isLoading={isSubmitting}
                    >
                      {tournament.nextBattle
                        ? "Start Next Battle"
                        : "End Tournament"}{" "}
                      <RiFlagLine />
                    </Button>
                  </Form>
                )}
            </Flex>
          </Container>
          {isOwner && tournament.state !== TournamentsState.END && (
            <Box pt={2}>
              <DashedLine />
            </Box>
          )}
        </Box>
      </HiddenEmbed>

      {isEmbed ? (
        <Outlet />
      ) : (
        <Container pb={4} px={2} maxW={1100}>
          <Outlet />
        </Container>
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
