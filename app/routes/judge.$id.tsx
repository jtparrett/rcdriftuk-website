import { TournamentsState } from "~/utils/enums";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  Form,
  Link,
  redirect,
  useLoaderData,
  useNavigation,
} from "react-router";
import { ChannelProvider, AblyProvider } from "ably/react";
import pluralize from "pluralize";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button } from "~/components/Button";
import { Glow } from "~/components/Glow";
import { Label } from "~/components/Label";
import { Select } from "~/components/Select";
import {
  styled,
  Flex,
  Spacer,
  Box,
  VStack,
  Container,
  Center,
} from "~/styled-system/jsx";
import { createAbly } from "~/utils/ably.server";
import { ably as AblyClient } from "~/utils/ably";
import { prisma } from "~/utils/prisma.server";
import { useAblyRealtimeReloader } from "~/utils/useAblyRealtimeReloader";
import { useReloader } from "~/utils/useReloader";
import { css } from "~/styled-system/css";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const judgeId = z.coerce.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      judges: {
        some: {
          id: judgeId,
        },
      },
    },
    include: {
      judges: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        where: {
          id: judgeId,
        },
      },
      nextQualifyingLap: {
        include: {
          scores: {
            where: {
              judgeId,
            },
          },
          driver: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              laps: true,
            },
          },
        },
      },
      nextBattle: {
        include: {
          driverLeft: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          driverRight: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          BattleVotes: {
            where: {
              judgeId,
            },
          },
        },
      },
    },
  });

  invariant(tournament);
  invariant(tournament.judges.length > 0, "No judges found");

  return {
    tournament,
    judge: tournament.judges[0],
  };
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const judgeId = z.coerce.string().parse(params.id);

  const judge = await prisma.tournamentJudges.findFirstOrThrow({
    where: {
      id: judgeId,
    },
    include: {
      tournament: true,
    },
  });

  const publishUpdate = () => {
    createAbly()
      .channels.get(judge.tournament.id)
      .publish("update", new Date().toISOString());
  };

  if (
    judge.tournament.state === TournamentsState.QUALIFYING &&
    judge.tournament.nextQualifyingLapId
  ) {
    const formData = await request.formData();
    const score = z.coerce.number().parse(formData.get("score"));

    await prisma.lapScores.upsert({
      where: {
        judgeId_lapId: {
          judgeId,
          lapId: judge.tournament.nextQualifyingLapId,
        },
      },
      update: {
        score,
      },
      create: {
        judgeId,
        lapId: judge.tournament.nextQualifyingLapId,
        score,
      },
    });
  }

  if (
    judge.tournament.state === TournamentsState.BATTLES &&
    judge.tournament.nextBattleId
  ) {
    const formData = await request.formData();
    const driverId = z.coerce.number().nullable().parse(formData.get("driver"));
    const isOMT = z.coerce.boolean().parse(formData.get("omt"));

    await prisma.tournamentBattleVotes.upsert({
      where: {
        judgeId_battleId: {
          judgeId,
          battleId: judge.tournament.nextBattleId,
        },
      },
      create: {
        judgeId,
        battleId: judge.tournament.nextBattleId,
        winnerId: driverId,
        omt: isOMT,
      },
      update: {
        winnerId: driverId,
        omt: isOMT,
        updatedAt: new Date(),
      },
    });
  }

  publishUpdate();

  return redirect(`/judge/${judgeId}`);
};

const QualiForm = () => {
  const { tournament } = useLoaderData<typeof loader>();
  const transition = useNavigation();

  const scoreValue = tournament.nextQualifyingLap?.scores[0]?.score;
  const qualifyingRun =
    (tournament.nextQualifyingLap?.driver?.laps?.findIndex(
      (lap) => lap.id === tournament.nextQualifyingLapId,
    ) ?? 0) + 1;

  if (tournament.nextQualifyingLap === null) {
    return null;
  }

  return (
    <>
      {transition.state !== "idle" ? (
        <p>Loading...</p>
      ) : (
        <>
          <Flex mb={6}>
            <styled.p fontWeight="semibold">
              #
              {tournament.nextQualifyingLap.driver.id
                .toString()
                .padStart(2, "0")}{" "}
              {tournament.nextQualifyingLap.driver.user.firstName}{" "}
              {tournament.nextQualifyingLap.driver.user.lastName}
            </styled.p>
            <Spacer />
            <styled.span color="brand.500" fontWeight="bold">
              Qualifying Run {qualifyingRun}
            </styled.span>
          </Flex>

          <Form method="post">
            <VStack alignItems="stretch" gap={6}>
              <Box>
                <Label>
                  Score ({scoreValue} {pluralize("point", scoreValue)})
                </Label>

                <Select
                  name="score"
                  aria-label="score-select"
                  value={scoreValue ?? ""}
                  onChange={(e) => {
                    e.target.form?.submit();
                  }}
                >
                  <option value="">Select a value</option>
                  {Array.from(new Array(101)).map((_, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </Select>
              </Box>
            </VStack>
          </Form>
        </>
      )}
    </>
  );
};

const BattleForm = () => {
  const { tournament } = useLoaderData<typeof loader>();
  const nextBattle = tournament.nextBattle;
  const battleVote = nextBattle?.BattleVotes[0];

  const leftDriverLead =
    (nextBattle?.driverLeft?.qualifyingPosition ?? 0) <
    (nextBattle?.driverRight?.qualifyingPosition ?? 0)
      ? true
      : false;

  return (
    <>
      {nextBattle?.winnerId !== null && (
        <styled.h2 fontSize="xl" textAlign="center" py={20}>
          Waiting for next battle...
        </styled.h2>
      )}

      {nextBattle !== null && nextBattle.winnerId === null && (
        <Form method="post">
          <Flex flexDir="column" gap={4}>
            {(nextBattle.driverLeft?.isBye ||
              nextBattle.driverRight?.isBye) && (
              <styled.p
                fontSize="md"
                fontWeight="semibold"
                color="gray.500"
                textAlign="center"
              >
                Bye Run
              </styled.p>
            )}

            {!nextBattle.driverLeft?.isBye && (
              <Button
                w="full"
                type="submit"
                name="driver"
                value={nextBattle.driverLeft?.id.toString()}
                variant={
                  battleVote?.winnerId === nextBattle.driverLeftId
                    ? "primary"
                    : "outline"
                }
              >
                {nextBattle.driverLeft?.user.firstName}{" "}
                {nextBattle.driverLeft?.user.lastName}{" "}
                {leftDriverLead && "(Lead First)"}
              </Button>
            )}

            {!nextBattle.driverRight?.isBye && (
              <Button
                w="full"
                type="submit"
                name="driver"
                value={nextBattle.driverRight?.id.toString()}
                variant={
                  battleVote?.winnerId === nextBattle.driverRightId
                    ? "primary"
                    : "outline"
                }
              >
                {nextBattle.driverRight?.user.firstName}{" "}
                {nextBattle.driverRight?.user.lastName}{" "}
                {!leftDriverLead && "(Lead First)"}
              </Button>
            )}

            {nextBattle.driverLeft?.isBye && nextBattle.driverRight?.isBye && (
              <Button
                w="full"
                type="submit"
                name="driver"
                value={nextBattle.driverRight?.id.toString()}
                variant={
                  battleVote?.winnerId === nextBattle.driverRightId
                    ? "primary"
                    : "outline"
                }
              >
                Click here to continue
              </Button>
            )}

            {!nextBattle.driverLeft?.isBye &&
              !nextBattle.driverRight?.isBye && (
                <Button
                  w="full"
                  type="submit"
                  name="omt"
                  value="true"
                  variant={battleVote?.omt ? "primary" : "outline"}
                >
                  OMT
                </Button>
              )}
          </Flex>
        </Form>
      )}
    </>
  );
};

const JudgePage = () => {
  const { tournament, judge } = useLoaderData<typeof loader>();

  useReloader();
  useAblyRealtimeReloader(tournament.id);

  return (
    <>
      <Center
        minH="60dvh"
        bgImage="url(/dot-bg.svg)"
        bgRepeat="repeat"
        bgSize="16px"
        bgPosition="center"
        pos="relative"
        zIndex={1}
        _before={{
          content: '""',
          pos: "absolute",
          inset: 0,
          bgGradient: "to-t",
          gradientFrom: "black",
          gradientVia: "rgba(12, 12, 12, 0)",
          gradientTo: "rgba(12, 12, 12, 0)",
          zIndex: -1,
        }}
      >
        <Container w={500} maxW="full">
          <Box
            bgColor="black"
            pos="relative"
            zIndex={1}
            p={1}
            borderWidth={1}
            borderColor="brand.700"
            rounded="3xl"
            shadow="0 12px 32px rgba(236, 26, 85, 0.25)"
          >
            <Glow />
            <Box
              borderWidth={1}
              borderColor="brand.700"
              rounded="2xl"
              overflow="hidden"
            >
              <Flex
                px={6}
                py={3}
                bgGradient="to-b"
                gradientFrom="brand.500"
                gradientTo="brand.700"
              >
                <styled.h1 fontSize="sm">
                  {judge.user.firstName} {judge.user.lastName}
                </styled.h1>
                <Spacer />
                <Link
                  to={`/tournaments/${tournament.id}/overview`}
                  className={css({
                    fontSize: "sm",
                  })}
                  replace
                >
                  {tournament.name}
                </Link>
              </Flex>
              <Box p={4} pb={8}>
                {tournament.state === TournamentsState.QUALIFYING && (
                  <QualiForm />
                )}
                {tournament.state === TournamentsState.BATTLES && (
                  <BattleForm />
                )}

                {tournament.state === TournamentsState.END && (
                  <styled.h2 textAlign="center" fontSize="xl">
                    Tournament Complete
                  </styled.h2>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Center>
    </>
  );
};

export default () => {
  const { tournament } = useLoaderData<typeof loader>();

  return (
    <AblyProvider client={AblyClient}>
      <ChannelProvider channelName={tournament.id}>
        <JudgePage />
      </ChannelProvider>
    </AblyProvider>
  );
};
