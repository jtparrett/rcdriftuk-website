import { TournamentsState } from "~/utils/enums";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { capitalCase, sentenceCase } from "change-case";
import { z } from "zod";
import { Glow } from "~/components/Glow";
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
import { getTournamentStandings } from "~/utils/getTournamentStandings";
import { useIsEmbed } from "~/utils/EmbedContext";
import { getRankColor, RANKS } from "~/utils/getDriverRank";
import { css } from "~/styled-system/css";

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
                  driverId: true,
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
                  carSetupChanges: {
                    where: {
                      type: "CHASSIS",
                    },
                  },
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
  const results = getTournamentStandings(tournament.battles).slice(0, 3);

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
                src={driver?.image ?? "/blank-driver-right.jpg"}
                alt={driver?.firstName ?? ""}
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

const DriverNameBoxLeft = ({
  name,
  driverNo,
  delay = 0,
}: {
  name?: string;
  driverNo?: number;
  delay?: number;
}) => {
  return (
    <motion.div
      className={css({
        pos: "absolute",
        bottom: 0,
        left: 0,
      })}
      initial={{ x: -200, opacity: 0, filter: "blur(8px)" }}
      animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
        delay,
      }}
    >
      <Box
        ml={-4}
        bgGradient="to-b"
        gradientFrom="brand.500"
        gradientTo="brand.700"
        zIndex={2}
        transform="skewX(16deg)"
        whiteSpace="nowrap"
        w="fit-content"
        shadow="0 -4px 8px rgba(0, 0, 0, 0.2)"
        borderTopRightRadius="xl"
      >
        <Flex transform="skewX(-16deg)">
          <Box
            bgGradient="to-b"
            gradientFrom="gray.800"
            gradientTo="gray.900"
            py={{ base: 1, md: 2 }}
            pr={3}
            pl={7}
            transform="skewX(16deg)"
          >
            <styled.p
              fontWeight="semibold"
              transform="skewX(-16deg)"
              fontSize={{ base: "sm", md: "lg" }}
            >
              {driverNo}
            </styled.p>
          </Box>
          <styled.p
            fontWeight="semibold"
            textTransform="uppercase"
            px={3}
            py={{ base: 1, md: 2 }}
            fontSize={{ base: "sm", md: "lg" }}
          >
            {name}
          </styled.p>
        </Flex>
      </Box>
    </motion.div>
  );
};

const DriverNameBoxRight = ({
  name,
  driverNo,
  delay = 0,
}: {
  name?: string;
  driverNo?: number;
  delay?: number;
}) => {
  return (
    <motion.div
      className={css({
        pos: "absolute",
        top: 0,
        right: 0,
        display: "flex",
        justifyContent: "flex-end",
      })}
      initial={{ x: 200, opacity: 0, filter: "blur(8px)" }}
      animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
        delay,
      }}
    >
      <Box
        mr={-4}
        bgGradient="to-b"
        gradientFrom="brand.500"
        gradientTo="brand.700"
        zIndex={2}
        transform="skewX(16deg)"
        whiteSpace="nowrap"
        w="fit-content"
        shadow="0 4px 8px rgba(0, 0, 0, 0.2)"
        borderBottomLeftRadius="xl"
      >
        <Flex transform="skewX(-16deg)">
          <styled.p
            fontWeight="semibold"
            textTransform="uppercase"
            px={3}
            py={{ base: 1, md: 2 }}
            fontSize={{ base: "sm", md: "lg" }}
          >
            {name}
          </styled.p>
          <Box
            bgGradient="to-b"
            gradientFrom="gray.800"
            gradientTo="gray.900"
            py={{ base: 1, md: 2 }}
            pl={3}
            pr={7}
            transform="skewX(16deg)"
          >
            <styled.p
              fontWeight="semibold"
              transform="skewX(-16deg)"
              fontSize={{ base: "sm", md: "lg" }}
            >
              {driverNo}
            </styled.p>
          </Box>
        </Flex>
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

  const qualifyingRun =
    (tournament.nextQualifyingLap?.driver?.laps?.findIndex(
      (lap) => lap.id === tournament.nextQualifyingLapId,
    ) ?? 0) + 1;

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

  return (
    <Flex
      p={isEmbed ? 0 : 1}
      borderWidth={isEmbed ? 0 : 1}
      rounded="3xl"
      bgColor="gray.900"
      borderColor="gray.800"
      minH={isEmbed ? "100dvh" : "60dvh"}
      className="main"
      letterSpacing="tight"
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
        px={2}
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
              py={{ base: 2, md: 3 }}
              borderTopRadius="11px"
              boxShadow="inset 0 1px rgba(255, 255, 255, 0.3)"
            >
              <styled.p
                fontSize={{ base: "md", md: "xl" }}
                fontWeight="semibold"
                lineHeight={1.1}
              >
                {tournament.name} |{" "}
                {capitalCase(
                  tournament.state === TournamentsState.END
                    ? "Final Result"
                    : tournament.state,
                )}{" "}
              </styled.p>
            </Box>

            {tournament.state === TournamentsState.END && <FinalResults />}

            {tournament?.state === TournamentsState.QUALIFYING &&
              tournament.nextQualifyingLap && (
                <Flex w={600} maxW="full" key={tournament.nextQualifyingLapId}>
                  <Box
                    pos="relative"
                    _after={{
                      content: '""',
                      pos: "absolute",
                      inset: 0,
                      bgGradient: "radial",
                      gradientFrom: "rgba(0, 0, 0, 0)",
                      gradientTo: "gray.950",
                      zIndex: 1,
                    }}
                    zIndex={1}
                    w="40%"
                  >
                    <motion.div
                      initial={{ x: -200, opacity: 0, filter: "blur(8px)" }}
                      animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                      className={css({
                        w: "full",
                      })}
                    >
                      <AspectRatio w="full" ratio={0.75}>
                        <styled.img
                          src={
                            tournament.nextQualifyingLap.driver.user.image ??
                            "/blank-driver-right.jpg"
                          }
                        />
                      </AspectRatio>
                    </motion.div>
                    <DriverNameBoxLeft
                      name={
                        tournament.nextQualifyingLap.driver.user.firstName +
                        " " +
                        tournament.nextQualifyingLap.driver.user.lastName
                      }
                      driverNo={
                        tournament.nextQualifyingLap.driver.user.driverId
                      }
                      delay={0.1}
                    />
                  </Box>

                  <Flex
                    flex={1}
                    flexDir="column"
                    gap={2}
                    justify="center"
                    pb={12}
                  >
                    {!qualiJudgingComplete && (
                      <>
                        <RightInfoBox delay={0}>
                          <styled.p
                            fontWeight="semibold"
                            fontSize={{ base: "md", md: "xl" }}
                          >
                            {numberToWords.toOrdinal(qualifyingRun)} Qualifying
                            Run
                          </styled.p>
                        </RightInfoBox>

                        {tournament.nextQualifyingLap.driver?.user.carSetupChanges.map(
                          (change, index) => {
                            return (
                              <RightInfoBox
                                key={change.id}
                                delay={0.1 * (index + 1)}
                              >
                                <styled.p
                                  fontWeight="semibold"
                                  fontSize={{ base: "md", md: "xl" }}
                                >
                                  {sentenceCase(change.type.toLowerCase())}:{" "}
                                  {change.value}
                                </styled.p>
                              </RightInfoBox>
                            );
                          },
                        )}

                        <RightInfoBox
                          delay={
                            0.1 *
                            (tournament.nextQualifyingLap.driver?.user
                              .carSetupChanges.length +
                              1)
                          }
                        >
                          <styled.p
                            fontWeight="semibold"
                            fontSize={{ base: "md", md: "xl" }}
                          >
                            Home Track: N/A
                          </styled.p>
                        </RightInfoBox>
                      </>
                    )}

                    {qualiJudgingComplete && (
                      <>
                        <RightInfoBox>
                          <styled.p
                            fontSize={{ base: "4xl", md: "6xl" }}
                            fontWeight="black"
                            pr={20}
                          >
                            {sumScores(
                              tournament.nextQualifyingLap.scores,
                              tournament.judges.length,
                            )}{" "}
                          </styled.p>
                        </RightInfoBox>

                        {tournament.nextQualifyingLap.scores.map((score, i) => {
                          return (
                            <RightInfoBox key={i} delay={0.1 * (i + 1)}>
                              <styled.p fontSize="sm">
                                {score.judge.user.firstName}: {score.score}
                              </styled.p>
                            </RightInfoBox>
                          );
                        })}
                      </>
                    )}
                  </Flex>
                </Flex>
              )}

            {tournament?.state === TournamentsState.BATTLES &&
              tournament.nextBattle && (
                <Flex
                  w={isEmbed ? 900 : 700}
                  maxW="full"
                  key={tournament.nextBattleId}
                  overflow="hidden"
                >
                  <Box
                    flex={1}
                    pos="relative"
                    transition="opacity 0.3s ease-in-out"
                    style={{
                      opacity:
                        winnerId === tournament.nextBattle?.driverLeftId ||
                        !battleJudgingComplete
                          ? 1
                          : 0.4,
                    }}
                  >
                    <motion.div
                      initial={{ x: -200, opacity: 0, filter: "blur(8px)" }}
                      animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                    >
                      <AspectRatio ratio={0.75} w="full">
                        <styled.img
                          src={
                            tournament.nextBattle.driverLeft?.user.image ??
                            "/blank-driver-left.jpg"
                          }
                        />
                      </AspectRatio>
                    </motion.div>

                    <DriverNameBoxLeft
                      delay={0.1}
                      name={
                        tournament.nextBattle.driverLeft?.user.firstName +
                        " " +
                        tournament.nextBattle.driverLeft?.user.lastName
                      }
                      driverNo={tournament.nextBattle.driverLeft?.user.driverId}
                    />
                  </Box>
                  <Flex
                    flex={1.2}
                    pos="relative"
                    justifyContent="center"
                    flexDir="column"
                    zIndex={1}
                    pb={8}
                    _after={{
                      content: '""',
                      pos: "absolute",
                      top: 0,
                      bottom: 0,
                      w: "3px",
                      left: "50%",
                      bgColor: "gray.800",
                      zIndex: -1,
                    }}
                  >
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
                                bgGradient="to-b"
                                gradientFrom="brand.500"
                                gradientTo="brand.700"
                                w="fit-content"
                                mx="auto"
                                py={2}
                                px={1}
                                rounded="md"
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
                                  color="brand.100"
                                  display={{
                                    base: "none",
                                    md: "block",
                                  }}
                                >
                                  {vote.judge.user.firstName}{" "}
                                  {vote.judge.user.lastName}
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
                  <Box
                    flex={1}
                    pos="relative"
                    transition="opacity 0.3s ease-in-out"
                    style={{
                      opacity:
                        winnerId === tournament.nextBattle?.driverRightId ||
                        !battleJudgingComplete
                          ? 1
                          : 0.4,
                    }}
                  >
                    <motion.div
                      initial={{ x: 200, opacity: 0, filter: "blur(8px)" }}
                      animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                    >
                      <AspectRatio ratio={0.75} w="full">
                        <styled.img
                          src={
                            tournament.nextBattle.driverRight?.user.image ??
                            "/blank-driver-right.jpg"
                          }
                        />
                      </AspectRatio>
                    </motion.div>

                    <DriverNameBoxRight
                      delay={0.1}
                      name={
                        tournament.nextBattle.driverRight?.user.firstName +
                        " " +
                        tournament.nextBattle.driverRight?.user.lastName
                      }
                      driverNo={
                        tournament.nextBattle.driverRight?.user.driverId
                      }
                    />
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
