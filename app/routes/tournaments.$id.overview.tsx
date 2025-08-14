import { TournamentsState } from "~/utils/enums";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { capitalCase } from "change-case";
import { z } from "zod";
import { Glow } from "~/components/Glow";
import {
  AspectRatio,
  Box,
  Center,
  Flex,
  Spacer,
  styled,
} from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { sumScores } from "~/utils/sumScores";
import { motion } from "motion/react";
import { RiTrophyLine } from "react-icons/ri";
import { getTournamentStandings } from "~/utils/getTournamentStandings";
import { useIsEmbed } from "~/utils/EmbedContext";
import { getRankColor, RANKS } from "~/utils/getDriverRank";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      judges: true,
      battles: {
        orderBy: [
          { round: "asc" },
          { bracket: "asc" },
          {
            id: "asc",
          },
        ],
        include: {
          tournament: {
            select: {
              format: true,
            },
          },
          driverLeft: {
            include: {
              user: true,
            },
          },
          driverRight: {
            include: {
              user: true,
            },
          },
        },
      },
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

  if (!tournament) {
    throw new Response("Not Found", { status: 404 });
  }

  return tournament;
};

const FinalResults = () => {
  const tournament = useLoaderData<typeof loader>();
  const results = getTournamentStandings(tournament.battles).slice(0, 3);

  return (
    <Flex w={700} maxW="full" flexDir="column" gap={2} p={4} textAlign="left">
      {results.map((driver) => {
        const i = results.indexOf(driver);
        const [bgColor] =
          i === 0
            ? getRankColor(RANKS.GOLD)
            : i === 1
              ? getRankColor(RANKS.SILVER)
              : getRankColor(RANKS.BRONZE);

        return (
          <Flex
            key={driver.id}
            overflow="hidden"
            style={{
              // @ts-ignore
              "--bg": bgColor,
              "--ml": i === 0 ? 0 : i === 1 ? "16px" : "32px",
            }}
            bgColor="var(--bg)"
            ml="var(--ml)"
            rounded="xl"
            pos="relative"
            zIndex={1}
            _after={{
              content: '""',
              pos: "absolute",
              inset: 0,
              pointerEvents: "none",
              bgGradient: "to-b",
              gradientFrom: "rgba(0, 0, 0, 0)",
              gradientTo: "rgba(0, 0, 0, 0.4)",
              zIndex: -1,
            }}
            shadow="inset 0 1px 0 rgba(255, 255, 255, 0.3)"
          >
            <AspectRatio ratio={1} w="78px" overflow="hidden" flex="none">
              <styled.img
                src={driver?.image ?? "/blank-driver-right.jpg"}
                alt={driver?.firstName ?? ""}
              />
            </AspectRatio>

            <styled.p
              fontWeight="black"
              fontSize="xl"
              textTransform="uppercase"
              fontStyle="italic"
              alignSelf="center"
              lineHeight={1.1}
              p={{ base: 4, md: 6 }}
              textShadow="1px 1px 2px rgba(0, 0, 0, 0.5)"
              flex={1}
              overflow="hidden"
            >
              <styled.span
                display="block"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
                maxW="100%"
              >
                {driver?.firstName}
              </styled.span>{" "}
              <styled.span
                display="block"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
                maxW="100%"
              >
                {driver?.lastName}
              </styled.span>
            </styled.p>

            <Center
              w={24}
              bgColor="rgba(0, 0, 0, 0.4)"
              flexDir="column"
              shadow="inset 2px 0 6px rgba(0, 0, 0, 0.3)"
              gap={0.5}
              flex="none"
            >
              <RiTrophyLine size={24} />
              <styled.span fontWeight="black">
                {i === 0 ? "1ST" : i === 1 ? "2ND" : "3RD"}
              </styled.span>
            </Center>
          </Flex>
        );
      })}
    </Flex>
  );
};
const TournamentsOverviewPage = () => {
  const tournament = useLoaderData<typeof loader>();
  const isEmbed = useIsEmbed();

  const qualiJudgingComplete =
    (tournament.nextQualifyingLap?.scores.length ?? 0) ===
    tournament.judges.length;

  const battleJudgingComplete =
    (tournament.nextBattle?.BattleVotes.length ?? 0) >=
    tournament.judges.length;

  const qualifyingRun =
    (tournament.nextQualifyingLap?.driver?.laps?.findIndex(
      (lap) => lap.id === tournament.nextQualifyingLapId,
    ) ?? 0) + 1;

  return (
    <Flex
      p={isEmbed ? 0 : 1}
      borderWidth={isEmbed ? 0 : 1}
      rounded="3xl"
      bgColor="gray.900"
      borderColor="gray.800"
      minH={isEmbed ? "100dvh" : "60dvh"}
      className="main"
    >
      <Center
        flexGrow={1}
        w="full"
        bgColor="black"
        bgImage={isEmbed ? undefined : "url(/dot-bg.svg)"}
        bgRepeat="repeat"
        bgSize="16px"
        bgPosition="center"
        borderWidth={isEmbed ? 0 : 1}
        rounded="2xl"
        borderColor="gray.800"
        className="bg"
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
                    ? "Final Results"
                    : tournament.state,
                )}
              </styled.p>
            </Box>

            {tournament.state === TournamentsState.END && <FinalResults />}

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
                          tournament.judges.length,
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
                <Flex w={isEmbed ? 1100 : 700} maxW="full">
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
                  <Box
                    flex={1.2}
                    py={{ base: 8, md: 12 }}
                    pos="relative"
                    zIndex={1}
                    _after={{
                      content: '""',
                      pos: "absolute",
                      top: 0,
                      bottom: 0,
                      w: "1px",
                      bgColor: "gray.800",
                      zIndex: -1,
                    }}
                  >
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
                              transition={{
                                duration: 1,
                                ease: "anticipate",
                              }}
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
    </Flex>
  );
};

export default TournamentsOverviewPage;
