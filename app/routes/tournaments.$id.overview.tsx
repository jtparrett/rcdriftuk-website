import { TournamentsDriverNumbers, TournamentsState } from "~/utils/enums";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { sentenceCase } from "change-case";
import { z } from "zod";
import numberToWords from "number-to-words";
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
import {
  RiArrowLeftDoubleFill,
  RiArrowRightDoubleFill,
  RiTrophyLine,
} from "react-icons/ri";
import { useIsEmbed } from "~/utils/EmbedContext";
import { getRankColor, RANKS } from "~/utils/getDriverRank";
import { css } from "~/styled-system/css";
import { DriverCard } from "~/components/DriverCard";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      judges: {
        orderBy: {
          createdAt: "asc",
        },
      },
      drivers: {
        select: {
          id: true,
          qualifyingPosition: true,
          finishingPosition: true,
          isBye: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              image: true,
              driverId: true,
            },
          },
        },
        orderBy: [
          {
            finishingPosition: "asc",
          },
          {
            qualifyingPosition: "asc",
          },
        ],
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
                  driverId: true,
                  elo: true,
                  ranked: true,
                  team: true,
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
                  driverId: true,
                  elo: true,
                  ranked: true,
                  team: true,
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
                  driverId: true,
                  elo: true,
                  ranked: true,
                  team: true,
                },
              },
              laps: true,
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
  const results = tournament.drivers.slice(0, 3);

  return (
    <Flex w={700} maxW="full" flexDir="column" gap={2} p={2} textAlign="left">
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
            style={
              {
                "--bg": bgColor,
                "--ml": i === 0 ? 0 : i === 1 ? "12px" : "24px",
              } as React.CSSProperties
            }
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
                src={driver?.user.image ?? "/blank-driver-right.jpg"}
                alt={driver?.user.firstName ?? ""}
              />
            </AspectRatio>

            <styled.p
              fontWeight="extrabold"
              fontSize={{ base: "lg", md: "xl" }}
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
                {driver?.user.firstName}
              </styled.span>{" "}
              <styled.span
                display="block"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
                maxW="100%"
              >
                {driver?.user.lastName}
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
              <styled.span fontWeight="extrabold">
                {i === 0 ? "1ST" : i === 1 ? "2ND" : "3RD"}
              </styled.span>
            </Center>
          </Flex>
        );
      })}
    </Flex>
  );
};

const RightInfoBox = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  return (
    <motion.div
      className={css({
        display: "flex",
        overflow: "hidden",
      })}
      initial={{ x: 200, opacity: 0, filter: "blur(8px)" }}
      animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
        delay,
      }}
    >
      <Spacer />
      <Box
        bgGradient="to-b"
        gradientFrom="gray.800"
        gradientTo="gray.900"
        py={2}
        pl={{ base: 4, md: 8 }}
        pr={{ base: 4, md: 10 }}
        transform="skewX(-16deg)"
        mr={-2}
        borderLeftWidth={4}
        borderColor="brand.500"
        whiteSpace="nowrap"
      >
        <Box transform="skewX(16deg)" textAlign="right">
          {children}
        </Box>
      </Box>
    </motion.div>
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

  const winThreshold = Math.floor(tournament.judges.length / 2 + 1);
  const battleVotesLeft =
    tournament.nextBattle?.BattleVotes.filter(
      (vote) => vote.winnerId === tournament.nextBattle?.driverLeftId,
    ) ?? [];
  const battleVotesRight =
    tournament.nextBattle?.BattleVotes.filter(
      (vote) => vote.winnerId === tournament.nextBattle?.driverRightId,
    ) ?? [];
  const winnerId =
    battleVotesLeft.length >= winThreshold
      ? tournament.nextBattle?.driverLeftId
      : battleVotesRight.length >= winThreshold
        ? tournament.nextBattle?.driverRightId
        : undefined;

  type Driver =
    | NonNullable<typeof tournament.nextQualifyingLap>["driver"]
    | NonNullable<typeof tournament.nextBattle>["driverLeft"]
    | NonNullable<typeof tournament.nextBattle>["driverRight"]
    | null
    | undefined;

  const getDriverNumber = (driver: Driver) => {
    if (!driver || tournament.driverNumbers === TournamentsDriverNumbers.NONE) {
      return undefined;
    }

    if (tournament.driverNumbers === TournamentsDriverNumbers.UNIVERSAL) {
      return driver.user.driverId;
    }

    return driver.tournamentDriverNumber;
  };

  return (
    <Flex
      p={isEmbed ? 0 : 1}
      borderWidth={isEmbed ? 0 : 1}
      rounded="3xl"
      bgColor="gray.900"
      borderColor="gray.800"
      className="main"
      letterSpacing="tight"
    >
      <Box
        flexGrow={1}
        bgColor="black"
        borderWidth={isEmbed ? 0 : 1}
        rounded="2xl"
        borderColor="gray.800"
        className="bg"
        overflow="hidden"
      >
        <Center
          minH="60dvh"
          bgImage="url(/dot-bg.svg)"
          bgRepeat="repeat"
          bgSize="16px"
          bgPosition="center"
          pos="relative"
          zIndex={1}
          rounded="2xl"
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.800"
          bgColor="gray.950"
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
          {tournament.state === TournamentsState.START && (
            <Box p={6}>
              <styled.h2 fontSize="xl" fontWeight="semibold">
                Waiting to start...
              </styled.h2>
            </Box>
          )}

          {tournament?.state === TournamentsState.QUALIFYING &&
            tournament.nextQualifyingLap && (
              <Flex
                w={isEmbed ? 800 : 600}
                maxW="full"
                key={tournament.nextQualifyingLapId}
                align="center"
                gap={0}
              >
                <Box w="45%" p={3} pl={4} flex="none">
                  <motion.div
                    initial={{ x: -80, opacity: 0, filter: "blur(8px)" }}
                    animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                  >
                    <DriverCard
                      firstName={
                        tournament.nextQualifyingLap.driver.user.firstName
                      }
                      lastName={
                        tournament.nextQualifyingLap.driver.user.lastName
                      }
                      image={tournament.nextQualifyingLap.driver.user.image}
                      driverNo={getDriverNumber(
                        tournament.nextQualifyingLap.driver,
                      )}
                      elo={tournament.nextQualifyingLap.driver.user.elo}
                      ranked={tournament.nextQualifyingLap.driver.user.ranked}
                      team={tournament.nextQualifyingLap.driver.user.team}
                    />
                  </motion.div>
                </Box>

                <Flex flex={1} flexDir="column" gap={1} justify="center" py={6}>
                  {!qualiJudgingComplete && (
                    <>
                      <RightInfoBox delay={0}>
                        <styled.p
                          fontWeight="semibold"
                          fontSize={{ base: "md", md: "xl" }}
                        >
                          {numberToWords.toOrdinal(
                            tournament.nextQualifyingLap.round,
                          )}{" "}
                          Qualifying Run
                        </styled.p>
                      </RightInfoBox>
                    </>
                  )}

                  {qualiJudgingComplete && (
                    <>
                      <RightInfoBox>
                        <styled.p
                          fontSize={{ base: "4xl", md: "100px" }}
                          fontWeight="black"
                          pr={10}
                        >
                          {sumScores(
                            tournament.nextQualifyingLap.scores,
                            tournament.judges.length,
                            tournament.scoreFormula,
                            tournament.nextQualifyingLap.penalty,
                            tournament.judges.map((j) => j.id),
                          )}
                        </styled.p>
                      </RightInfoBox>

                      {tournament.nextQualifyingLap.penalty < 0 && (
                        <RightInfoBox>
                          <styled.p fontSize="sm" color="brand.500">
                            Penalty: {tournament.nextQualifyingLap.penalty}
                          </styled.p>
                        </RightInfoBox>
                      )}

                      {tournament.nextQualifyingLap.scores.map((score, i) => {
                        return (
                          <RightInfoBox key={i} delay={0.1 * (i + 1)}>
                            <styled.p fontSize="sm">
                              Judge {i + 1}: {score.score}
                            </styled.p>
                          </RightInfoBox>
                        );
                      })}
                    </>
                  )}
                </Flex>
              </Flex>
            )}

          {tournament.state === TournamentsState.QUALIFYING &&
            tournament.nextQualifyingLapId === null && (
              <Box p={6}>
                <styled.h2 fontSize="xl" fontWeight="semibold">
                  Qualifying Complete
                </styled.h2>
              </Box>
            )}

          {tournament?.state === TournamentsState.BATTLES &&
            tournament.nextBattle && (
              <Flex
                key={tournament.nextBattleId}
                overflow="hidden"
                pos="relative"
                zIndex={0}
                align="center"
                py={4}
                px={2}
                gap={0}
                w={900}
              >
                {/* Left driver card */}
                <Flex
                  flex={1}
                  justify="center"
                  align="center"
                  p={2}
                  transition="all 0.4s ease-in-out"
                  style={{
                    opacity:
                      winnerId === tournament.nextBattle?.driverLeftId ||
                      !battleJudgingComplete
                        ? 1
                        : 0.35,
                    transform:
                      winnerId === tournament.nextBattle?.driverLeftId
                        ? "scale(1.05)"
                        : winnerId &&
                            winnerId !== tournament.nextBattle?.driverLeftId
                          ? "scale(0.92)"
                          : "scale(1)",
                    filter:
                      winnerId &&
                      winnerId !== tournament.nextBattle?.driverLeftId
                        ? "saturate(0.3)"
                        : "saturate(1)",
                  }}
                >
                  <motion.div
                    initial={{ x: -100, opacity: 0, filter: "blur(8px)" }}
                    animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                    className={css({ w: "full", maxW: "240px" })}
                  >
                    <DriverCard
                      side="left"
                      firstName={
                        tournament.nextBattle.driverLeft?.user.firstName
                      }
                      lastName={tournament.nextBattle.driverLeft?.user.lastName}
                      image={tournament.nextBattle.driverLeft?.user.image}
                      driverNo={getDriverNumber(
                        tournament.nextBattle.driverLeft,
                      )}
                      elo={tournament.nextBattle.driverLeft?.user.elo}
                      ranked={tournament.nextBattle.driverLeft?.user.ranked}
                      team={tournament.nextBattle.driverLeft?.user.team}
                    />
                  </motion.div>
                </Flex>

                {/* Center VS / Judge results */}
                <Flex
                  w="140px"
                  flex="none"
                  justifyContent="center"
                  flexDir="column"
                  pos="relative"
                  zIndex={2}
                >
                  {!battleJudgingComplete && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        duration: 0.3,
                        ease: "backOut",
                        delay: 0.3,
                      }}
                    >
                      <styled.p
                        textAlign="center"
                        color="gray.500"
                        fontSize="2xl"
                        fontWeight="black"
                        fontStyle="italic"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        vs
                      </styled.p>
                    </motion.div>
                  )}
                  {battleJudgingComplete && (
                    <>
                      {tournament.nextBattle.BattleVotes.map((vote, i) => {
                        const winnerDirection =
                          vote.winnerId === null
                            ? undefined
                            : vote.winnerId ===
                                tournament.nextBattle?.driverLeftId
                              ? "left"
                              : "right";

                        const winnerX =
                          vote.winnerId === null
                            ? "0%"
                            : vote.winnerId ===
                                tournament.nextBattle?.driverLeftId
                              ? "-25%"
                              : "25%";

                        return (
                          <motion.div
                            key={i}
                            animate={{ x: winnerX }}
                            transition={{
                              duration: 1,
                              ease: "anticipate",
                              delay: 0.1 * i,
                            }}
                          >
                            <Box
                              w="fit-content"
                              mx="auto"
                              textAlign="center"
                              mb={0.5}
                            >
                              <styled.p
                                fontWeight="bold"
                                fontSize="xs"
                                w="full"
                                whiteSpace="nowrap"
                                textOverflow="ellipsis"
                                overflow="hidden"
                                display={{
                                  base: "none",
                                  md: "block",
                                }}
                              >
                                Judge {i + 1}
                              </styled.p>
                              <Flex align="center" justify="center">
                                <Box
                                  style={{
                                    opacity:
                                      winnerDirection === "left" ? 1 : 0.3,
                                  }}
                                >
                                  <RiArrowLeftDoubleFill />
                                </Box>
                                <styled.p
                                  lineHeight={1}
                                  fontSize={{ base: "sm", md: "lg" }}
                                  fontWeight="extrabold"
                                  fontStyle="italic"
                                  textTransform="uppercase"
                                >
                                  {vote.omt ? "OMT" : "Advance"}
                                </styled.p>
                                <Box
                                  style={{
                                    opacity:
                                      winnerDirection === "right" ? 1 : 0.3,
                                  }}
                                >
                                  <RiArrowRightDoubleFill />
                                </Box>
                              </Flex>
                            </Box>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </Flex>

                {/* Right driver card */}
                <Flex
                  flex={1}
                  justify="center"
                  align="center"
                  p={2}
                  transition="all 0.4s ease-in-out"
                  style={{
                    opacity:
                      winnerId === tournament.nextBattle?.driverRightId ||
                      !battleJudgingComplete
                        ? 1
                        : 0.35,
                    transform:
                      winnerId === tournament.nextBattle?.driverRightId
                        ? "scale(1.05)"
                        : winnerId &&
                            winnerId !== tournament.nextBattle?.driverRightId
                          ? "scale(0.92)"
                          : "scale(1)",
                    filter:
                      winnerId &&
                      winnerId !== tournament.nextBattle?.driverRightId
                        ? "saturate(0.3)"
                        : "saturate(1)",
                  }}
                >
                  <motion.div
                    initial={{ x: 100, opacity: 0, filter: "blur(8px)" }}
                    animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                    className={css({ w: "full", maxW: "240px" })}
                  >
                    <DriverCard
                      side="right"
                      firstName={
                        tournament.nextBattle.driverRight?.user.firstName
                      }
                      lastName={
                        tournament.nextBattle.driverRight?.user.lastName
                      }
                      image={tournament.nextBattle.driverRight?.user.image}
                      driverNo={getDriverNumber(
                        tournament.nextBattle.driverRight,
                      )}
                      elo={tournament.nextBattle.driverRight?.user.elo}
                      ranked={tournament.nextBattle.driverRight?.user.ranked}
                      team={tournament.nextBattle.driverRight?.user.team}
                    />
                  </motion.div>
                </Flex>
              </Flex>
            )}

          {tournament?.state === TournamentsState.BATTLES &&
            !tournament.nextBattle && (
              <Box p={6}>
                <styled.h2 fontSize="xl" fontWeight="semibold">
                  Battles Complete
                </styled.h2>
              </Box>
            )}

          {tournament.state === TournamentsState.END && <FinalResults />}
        </Center>
      </Box>
    </Flex>
  );
};

export default TournamentsOverviewPage;
