import { TournamentsState } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { capitalCase } from "change-case";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Glow } from "~/components/Glow";
import { AspectRatio, Box, Center, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { sumScores } from "~/utils/sumScores";
import { motion } from "motion/react";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      judges: true,
      nextBattle: {
        include: {
          BattleVotes: {
            include: {
              judge: {
                include: {
                  user: {
                    select: {
                      image: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          driverLeft: {
            include: {
              user: {
                select: {
                  image: true,
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
                  image: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      nextQualifyingLap: {
        include: {
          scores: {
            include: {
              judge: {
                include: {
                  user: {
                    select: {
                      image: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          driver: {
            include: {
              user: {
                select: {
                  image: true,
                  firstName: true,
                  lastName: true,
                },
              },
              laps: {
                where: {
                  scores: {
                    none: {},
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return tournament;
};

const TournamentsOverviewPage = () => {
  const tournament = useLoaderData<typeof loader>();

  invariant(tournament);

  const qualiJudgingComplete =
    (tournament.nextQualifyingLap?.scores.length ?? 0) ===
    tournament.judges.length;

  const battleJudgingComplete =
    (tournament.nextBattle?.BattleVotes.length ?? 0) >=
    tournament.judges.length;

  const qualifyingRun =
    (tournament.nextQualifyingLap?.driver?.laps?.findIndex(
      (lap) => lap.id === tournament.nextQualifyingLapId
    ) ?? 0) + 1;

  return (
    <Box
      p={1}
      borderWidth={1}
      rounded="3xl"
      bgColor="gray.900"
      borderColor="gray.800"
    >
      <Center
        minH="60dvh"
        bgColor="black"
        bgImage="url(/dot-bg.svg)"
        bgRepeat="repeat"
        bgSize="16px"
        bgPosition="center"
        borderWidth={1}
        rounded="2xl"
        borderColor="gray.800"
      >
        <Box
          bgColor="black"
          p={1}
          borderWidth={1}
          rounded="2xl"
          borderColor="brand.500"
          minW={260}
          mb={4}
          maxW="full"
          shadow="0 12px 32px rgba(236, 26, 85, 0.25)"
          pos="relative"
          zIndex={1}
        >
          <Glow />
          <Box
            borderRadius="xl"
            borderWidth={1}
            borderColor="brand.700"
            overflow="hidden"
            textAlign="center"
          >
            <Box
              bgGradient="to-b"
              gradientFrom="brand.500"
              gradientTo="brand.700"
              px={4}
              py={2}
              borderTopRadius="11px"
              boxShadow="inset 0 1px rgba(255, 255, 255, 0.3)"
            >
              <styled.p fontWeight="semibold">
                {capitalCase(
                  tournament.state === TournamentsState.END
                    ? "Tournament Finished"
                    : tournament.state
                )}
              </styled.p>
            </Box>
            {tournament?.state === TournamentsState.QUALIFYING &&
              tournament.nextQualifyingLap && (
                <>
                  <Box p={4}>
                    <styled.p fontSize="lg" fontWeight="extrabold">
                      {tournament.nextQualifyingLap.driver.user.firstName}{" "}
                      {tournament.nextQualifyingLap.driver.user.lastName}
                    </styled.p>
                    {!qualiJudgingComplete && (
                      <styled.p fontSize="sm" color="gray.400">
                        Qualifying Run {qualifyingRun}
                      </styled.p>
                    )}
                  </Box>

                  {qualiJudgingComplete && (
                    <Box>
                      <styled.p fontSize="6xl" fontWeight="extrabold" pb={4}>
                        {sumScores(
                          tournament.nextQualifyingLap.scores,
                          tournament.judges.length
                        )}
                      </styled.p>
                      <Flex textAlign="center" gap="1px">
                        {tournament.nextQualifyingLap.scores.map((score, i) => {
                          return (
                            <Box
                              key={i}
                              flex={1}
                              lineHeight="1"
                              py={2}
                              bgColor="gray.900"
                            >
                              <styled.p fontSize="lg">{score.score}</styled.p>
                              <styled.p fontSize="sm">
                                {score.judge.user.firstName}{" "}
                                {score.judge.user.lastName}
                              </styled.p>
                            </Box>
                          );
                        })}
                      </Flex>
                    </Box>
                  )}
                </>
              )}

            {tournament?.state === TournamentsState.BATTLES &&
              tournament.nextBattle && (
                <Flex w={700} maxW="full">
                  <Box
                    flex={1}
                    borderRightWidth={1}
                    borderColor="brand.500"
                    overflow="hidden"
                  >
                    <AspectRatio ratio={0.75} w="full">
                      <styled.img
                        src={
                          tournament.nextBattle.driverLeft?.user.image ??
                          "/blank-driver-left.jpg"
                        }
                      />
                    </AspectRatio>
                    <styled.p
                      w="full"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      whiteSpace="nowrap"
                      fontSize={{ base: "sm", md: "lg" }}
                      fontWeight="extrabold"
                      py={2}
                    >
                      {tournament.nextBattle.driverLeft?.user.firstName}{" "}
                      {tournament.nextBattle.driverLeft?.user.lastName}
                    </styled.p>
                  </Box>
                  <Box flex={1.2} py={{ base: 8, md: 12 }}>
                    {battleJudgingComplete && (
                      <>
                        {tournament.nextBattle.BattleVotes.map((vote, i) => {
                          const winnerDirection =
                            vote.winnerId === null
                              ? "0%"
                              : vote.winnerId ===
                                  tournament.nextBattle?.driverLeftId
                                ? "-25%"
                                : "25%";

                          return (
                            <motion.div
                              key={i}
                              animate={{ x: winnerDirection }}
                            >
                              <Box
                                rounded="xl"
                                bgGradient="to-b"
                                gradientFrom="brand.500"
                                gradientTo="brand.700"
                                w={{ base: "85px", md: "120px" }}
                                mx="auto"
                                mb={2}
                                py={2}
                                textAlign="center"
                              >
                                <styled.p
                                  fontWeight="bold"
                                  fontSize="xs"
                                  w="full"
                                  whiteSpace="nowrap"
                                  textOverflow="ellipsis"
                                  overflow="hidden"
                                >
                                  {vote.judge.user.firstName}{" "}
                                  {vote.judge.user.lastName}
                                </styled.p>
                                <styled.p
                                  lineHeight={1}
                                  fontSize={{ base: "sm", md: "lg" }}
                                  fontWeight="extrabold"
                                  textTransform="uppercase"
                                >
                                  {vote.omt ? "OMT" : "Advance"}
                                </styled.p>
                              </Box>
                            </motion.div>
                          );
                        })}
                      </>
                    )}
                  </Box>
                  <Box
                    flex={1}
                    borderLeftWidth={1}
                    borderColor="brand.500"
                    overflow="hidden"
                  >
                    <AspectRatio ratio={0.75} w="full">
                      <styled.img
                        src={
                          tournament.nextBattle.driverRight?.user.image ??
                          "/blank-driver-right.jpg"
                        }
                      />
                    </AspectRatio>
                    <styled.p
                      w="full"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      whiteSpace="nowrap"
                      fontSize={{ base: "sm", md: "lg" }}
                      fontWeight="extrabold"
                      py={2}
                    >
                      {tournament.nextBattle.driverRight?.user.firstName}{" "}
                      {tournament.nextBattle.driverRight?.user.lastName}
                    </styled.p>
                  </Box>
                </Flex>
              )}
          </Box>
        </Box>
      </Center>
    </Box>
  );
};

export default TournamentsOverviewPage;
