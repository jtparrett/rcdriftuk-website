import type { LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";
import {
  Box,
  Container,
  styled,
  VStack,
  Flex,
  Spacer,
  Grid,
} from "~/styled-system/jsx";
import { getDriverRank, RANKS } from "~/utils/getDriverRank";
import { prisma } from "~/utils/prisma.server";
import { useState } from "react";
import { RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import type { Values } from "~/utils/values";
import { format } from "date-fns";
import { Regions } from "~/utils/enums";
import type { Route } from "./+types/drivers.$id";
import { css } from "~/styled-system/css";
import { TabButton } from "~/components/Tab";
import { getAuth } from "~/utils/getAuth.server";
import { PostCard } from "~/components/PostCard";
import { getUser, type GetUser } from "~/utils/getUser.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const driverId = z.coerce.number().parse(params.id);
  const { userId } = await getAuth(args);

  let user: GetUser | null = null;

  if (userId) {
    user = await getUser(userId);
  }

  const driver = await prisma.users.findFirstOrThrow({
    where: {
      driverId,
    },
    select: {
      driverId: true,
      firstName: true,
      lastName: true,
      image: true,
      team: true,
      elo: true,
      elo_UK: true,
      elo_EU: true,
      elo_NA: true,
      elo_APAC: true,
      elo_LATAM: true,
      elo_MEA: true,
      totalBattles: true,
      Posts: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          track: {
            select: {
              id: true,
              slug: true,
              name: true,
              image: true,
            },
          },
          ...(userId
            ? {
                likes: {
                  where: {
                    userId,
                  },
                },
              }
            : {}),
          comments: {
            where: {
              parentId: null,
            },
            include: {
              user: true,
              replies: {
                include: {
                  user: true,
                },
              },
            },
            orderBy: {
              id: "asc",
            },
          },
        },
      },
      TournamentDrivers: {
        where: {
          tournament: {
            rated: true,
          },
        },
        orderBy: [
          {
            tournament: {
              createdAt: "asc",
            },
          },
        ],
        select: {
          leftBattles: {
            select: {
              id: true,
              createdAt: true,
              driverLeft: {
                select: {
                  id: true,
                  driverId: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      image: true,
                      driverId: true,
                    },
                  },
                },
              },
              driverRight: {
                select: {
                  id: true,
                  driverId: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      image: true,
                      driverId: true,
                    },
                  },
                },
              },
              winnerId: true,
              winnerElo: true,
              loserElo: true,
              winnerStartingElo: true,
              loserStartingElo: true,
              tournament: {
                select: {
                  name: true,
                  createdAt: true,
                  id: true,
                },
              },
            },
          },
          rightBattles: {
            select: {
              id: true,
              createdAt: true,
              driverLeft: {
                select: {
                  id: true,
                  driverId: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      image: true,
                      driverId: true,
                    },
                  },
                },
              },
              driverRight: {
                select: {
                  id: true,
                  driverId: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      image: true,
                      driverId: true,
                    },
                  },
                },
              },
              winnerId: true,
              winnerElo: true,
              loserElo: true,
              winnerStartingElo: true,
              loserStartingElo: true,
              tournament: {
                select: {
                  name: true,
                  createdAt: true,
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return { driver, user };
};

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data) return [];

  return [
    {
      title: `RC Drift UK | Driver Ratings | ${data.driver.firstName} ${data.driver.lastName}`,
    },
  ];
};

const TABS = {
  battleHistory: "Battle History",
  ratingHistory: "Rating History",
  regionalRatings: "Regional Ratings",
  posts: "Posts",
};

const Page = () => {
  const { driver, user } = useLoaderData<typeof loader>();
  const battles = driver.TournamentDrivers.flatMap((item) => {
    return [...item.leftBattles, ...item.rightBattles];
  }).sort(
    (a, b) =>
      new Date(a.tournament.createdAt).getTime() -
        new Date(b.tournament.createdAt).getTime() || a.id - b.id,
  );

  const rank = driver
    ? getDriverRank(driver.elo, driver.totalBattles)
    : RANKS.UNRANKED;

  const [tab, setTab] = useState<Values<typeof TABS>>(TABS.battleHistory);

  const [expandedBattles, setExpandedBattles] = useState<string[]>([]);

  const toggleBattle = (battleId: string) => {
    setExpandedBattles((prev) =>
      prev.includes(battleId)
        ? prev.filter((id) => id !== battleId)
        : [...prev, battleId],
    );
  };

  return (
    <Box
      pos="relative"
      zIndex={1}
      overflow="hidden"
      _after={{
        content: '""',
        pos: "absolute",
        top: 0,
        left: 0,
        right: 0,
        h: "100dvh",
        bgImage: "url(/dot-bg.svg)",
        bgSize: "16px",
        bgPosition: "center",
        bgRepeat: "repeat",
        zIndex: -2,
      }}
      _before={{
        content: '""',
        pos: "absolute",
        top: 0,
        left: 0,
        right: 0,
        h: "100dvh",
        bgGradient: "to-t",
        gradientFrom: "black",
        gradientTo: "rgba(12, 12, 12, 0)",
        zIndex: -1,
      }}
    >
      <Container maxW={800} px={4} py={6}>
        {driver && (
          <Flex>
            <Spacer />
            <Flex
              p={1}
              rounded="full"
              bg="gray.950"
              borderWidth={1}
              borderColor="gray.800"
              shadow="lg"
              alignItems="center"
              gap={1}
            >
              <styled.span fontSize="md" fontWeight="medium" pl={2}>
                {driver.elo.toFixed(3)}
              </styled.span>
              <Box w={8} h={8} perspective="200px">
                <styled.img
                  src={`/badges/${rank}.png`}
                  w="full"
                  alt={rank}
                  animation="badge 4s linear infinite"
                />
              </Box>
            </Flex>
          </Flex>
        )}

        <Flex textAlign="center" alignItems="center" flexDir="column" pb={12}>
          <Box p={2} rounded="full" bg="rgba(255, 255, 255, 0.1)" mb={4}>
            <Box
              rounded="full"
              overflow="hidden"
              borderWidth={1}
              borderColor="gray.700"
              p={2}
              bg="gray.950"
            >
              <styled.img
                display="block"
                src={driver.image ?? "/blank-driver-right.jpg"}
                alt={`${driver.firstName} ${driver.lastName}`}
                w={32}
                h={32}
                rounded="full"
                objectFit="cover"
              />
            </Box>
          </Box>

          <styled.span
            borderWidth={1}
            borderColor="gray.800"
            px={2}
            py={1}
            rounded="full"
            fontSize="xs"
            color="gray.400"
            bgColor="black"
            mb={1}
          >
            #{driver.driverId}
          </styled.span>

          <styled.h1 fontSize="4xl" fontWeight="bold" lineHeight={1.1} mb={3}>
            {driver.firstName} {driver.lastName}
          </styled.h1>

          {driver.team && (
            <Flex gap={1} flexWrap="wrap" justifyContent="center" px={4}>
              {driver.team.split(",").map((team) => (
                <styled.p
                  color="gray.400"
                  fontSize="sm"
                  fontWeight="medium"
                  px={2}
                  rounded="full"
                  borderWidth={1}
                  borderColor="gray.800"
                >
                  {team}
                </styled.p>
              ))}
            </Flex>
          )}
        </Flex>

        <Flex
          p={2}
          borderWidth={1}
          borderColor="gray.800"
          rounded="xl"
          mb={2}
          gap={0.5}
          overflowX="auto"
          bgColor="gray.950"
        >
          <TabButton
            isActive={tab === TABS.battleHistory}
            onClick={() => setTab(TABS.battleHistory)}
          >
            Battle History
          </TabButton>
          <TabButton
            isActive={tab === TABS.ratingHistory}
            onClick={() => setTab(TABS.ratingHistory)}
          >
            Rating History
          </TabButton>
          <TabButton
            isActive={tab === TABS.regionalRatings}
            onClick={() => setTab(TABS.regionalRatings)}
          >
            Regional Ratings
          </TabButton>
          <TabButton
            isActive={tab === TABS.posts}
            onClick={() => setTab(TABS.posts)}
          >
            Posts
          </TabButton>
        </Flex>

        {tab === TABS.ratingHistory &&
          driver &&
          driver.TournamentDrivers.length > 0 && (
            <Box
              px={6}
              pt={10}
              borderRadius="xl"
              borderWidth={1}
              borderColor="gray.800"
              bgGradient="to-b"
              gradientFrom="gray.900"
              gradientTo="black"
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={[
                    { elo: 1000 },
                    ...battles.map((battle) => {
                      const isLeftDriver =
                        battle.driverLeft?.driverId === driver.driverId;
                      const isWinner = isLeftDriver
                        ? battle.winnerId === battle.driverLeft?.id
                        : battle.winnerId === battle.driverRight?.id;

                      return {
                        date: format(battle.tournament.createdAt, "MMM, yy"),
                        elo: isWinner ? battle.winnerElo : battle.loserElo,
                        startingElo: isWinner
                          ? battle.winnerStartingElo
                          : battle.loserStartingElo,
                      };
                    }),
                  ]}
                  margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorElo" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="rgba(236, 26, 85, 0.3)"
                        stopOpacity={1}
                      />
                      <stop
                        offset="95%"
                        stopColor="rgba(236, 26, 85, 0)"
                        stopOpacity={1}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval="preserveStartEnd"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    domain={[
                      (dataMin: number) =>
                        Math.min(1000, Math.floor(dataMin * 0.9)),
                      (dataMax: number) => Math.ceil(dataMax),
                    ]}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="elo"
                    stroke="#ec1a55"
                    fill="url(#colorElo)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}

        {tab === TABS.battleHistory && battles.length > 0 && (
          <VStack gap={4} mt={4}>
            {battles.map((battle, i) => {
              const isLeftDriver =
                battle.driverLeft?.driverId === driver.driverId;
              const isWinner = isLeftDriver
                ? battle.winnerId === battle.driverLeft?.id
                : battle.winnerId === battle.driverRight?.id;

              const isExpanded = expandedBattles.includes(battle.id.toString());
              const startingElo = isWinner
                ? battle?.winnerStartingElo ?? 1000
                : battle?.loserStartingElo ?? 1000;
              const endingElo = isWinner
                ? battle?.winnerElo ?? 1000
                : battle?.loserElo ?? 1000;
              const pointsChange = endingElo - startingElo;

              const opponentStartingElo = isWinner
                ? battle?.loserStartingElo ?? 1000
                : battle?.winnerStartingElo ?? 1000;

              const opponentElo = isWinner
                ? battle?.loserElo ?? 1000
                : battle?.winnerElo ?? 1000;

              const opponentPointsChange = opponentElo - opponentStartingElo;

              const isByeRun =
                battle.driverLeft?.driverId === 0 ||
                battle.driverRight?.driverId === 0;

              const color = isByeRun
                ? "yellow.500"
                : isWinner
                  ? "green.500"
                  : "red.500";
              const bgColor = isByeRun
                ? "yellow.950"
                : isWinner
                  ? "green.950"
                  : "red.950";

              return (
                <Box
                  key={battle.id}
                  bgColor={bgColor}
                  p={1}
                  rounded="2xl"
                  width="full"
                  cursor="pointer"
                >
                  <Box
                    borderRadius="xl"
                    pos="relative"
                    zIndex={1}
                    borderWidth={1}
                    borderColor={color}
                  >
                    <Box
                      onClick={() => toggleBattle(battle.id.toString())}
                      pos="absolute"
                      inset={0}
                      zIndex={1}
                    />

                    <styled.span
                      fontSize="xs"
                      color={color}
                      pos="absolute"
                      top={0}
                      left={4}
                      ml={-2}
                      bgColor={bgColor}
                      borderWidth={1}
                      borderColor={color}
                      fontWeight="semibold"
                      px={2}
                      py={1}
                      rounded="full"
                      lineHeight={1}
                      transform="translateY(-50%)"
                    >
                      Battle #{i + 1}
                    </styled.span>

                    <Flex p={4} alignItems="center" gap={3}>
                      <Box
                        w={8}
                        h={8}
                        overflow="hidden"
                        rounded="md"
                        mb={1}
                        borderWidth={1}
                        borderColor={color}
                      >
                        <styled.img
                          src={driver.image ?? "/blank-driver-right.jpg"}
                          w="full"
                          h="full"
                          objectFit="cover"
                        />
                      </Box>

                      {!isByeRun && (
                        <Box
                          w={8}
                          h={8}
                          overflow="hidden"
                          rounded="md"
                          ml={-9}
                          mt={1}
                          borderWidth={1}
                          borderColor={color}
                        >
                          <styled.img
                            src={
                              isLeftDriver
                                ? battle.driverRight?.user.image ??
                                  "/blank-driver-right.jpg"
                                : battle.driverLeft?.user.image ??
                                  "/blank-driver-right.jpg"
                            }
                            w="full"
                            h="full"
                            objectFit="cover"
                          />
                        </Box>
                      )}

                      <Box flex={1} overflow="hidden">
                        {!isByeRun && (
                          <styled.p
                            fontWeight="medium"
                            letterSpacing="tight"
                            lineHeight={1.1}
                          >
                            <styled.span
                              color={isWinner ? "green.400" : "red.400"}
                            >
                              {isWinner ? "Won vs" : "Lost vs"}
                            </styled.span>{" "}
                            <Link
                              to={`/drivers/${
                                isLeftDriver
                                  ? battle.driverRight?.user.driverId
                                  : battle.driverLeft?.user.driverId
                              }`}
                              className={css({
                                pos: "relative",
                                zIndex: 2,
                                _hover: {
                                  textDecoration: "underline",
                                },
                              })}
                            >
                              {isLeftDriver
                                ? battle.driverRight?.user.firstName +
                                  " " +
                                  battle.driverRight?.user.lastName
                                : battle.driverLeft?.user.firstName +
                                  " " +
                                  battle.driverLeft?.user.lastName}
                            </Link>
                          </styled.p>
                        )}

                        {isByeRun && (
                          <styled.p
                            lineHeight={1.1}
                            color="yellow.400"
                            fontWeight="medium"
                            letterSpacing="tight"
                          >
                            BYE RUN
                          </styled.p>
                        )}

                        <Link
                          to={`/tournaments/${battle.tournament.id}/overview`}
                          className={css({
                            fontSize: "sm",
                            color: "gray.200",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            pos: "relative",
                            letterSpacing: "tight",
                            zIndex: 2,
                            _hover: {
                              textDecoration: "underline",
                            },
                          })}
                        >
                          {battle.tournament.name}
                        </Link>
                      </Box>

                      <styled.span
                        fontSize={{ base: "sm", md: "lg" }}
                        fontWeight="semibold"
                        color={pointsChange >= 0 ? "green.400" : "red.400"}
                      >
                        {pointsChange > 0 ? "+" : ""}
                        {pointsChange.toFixed(3)}
                      </styled.span>

                      {isExpanded ? (
                        <RiArrowUpSLine size={20} />
                      ) : (
                        <RiArrowDownSLine size={20} />
                      )}
                    </Flex>

                    {isExpanded && (
                      <Box borderTopWidth={1} borderColor={color}>
                        <Flex>
                          <Box p={4} flex={1}>
                            <styled.h4
                              fontSize="sm"
                              fontWeight="bold"
                              color="gray.400"
                              mb={1}
                            >
                              {isLeftDriver
                                ? battle.driverLeft?.user.firstName +
                                  " " +
                                  battle.driverLeft?.user.lastName
                                : battle.driverRight?.user.firstName +
                                  " " +
                                  battle.driverRight?.user.lastName}
                            </styled.h4>
                            <styled.div fontSize="sm" color="gray.300">
                              Starting: {startingElo.toFixed(3)}
                            </styled.div>
                            <styled.div fontSize="sm" color="gray.300">
                              Final: {endingElo.toFixed(3)}
                            </styled.div>
                            <styled.div
                              fontSize="sm"
                              color={
                                pointsChange >= 0 ? "green.400" : "red.400"
                              }
                            >
                              Change: {pointsChange >= 0 ? "+" : ""}
                              {pointsChange.toFixed(3)}
                            </styled.div>
                          </Box>

                          <Box w="1px" bgColor={color} />

                          <Box p={4} flex={1}>
                            <styled.h4
                              fontSize="sm"
                              fontWeight="bold"
                              color="gray.400"
                              mb={1}
                            >
                              {isLeftDriver
                                ? battle.driverRight?.user.firstName +
                                  " " +
                                  battle.driverRight?.user.lastName
                                : battle.driverLeft?.user.firstName +
                                  " " +
                                  battle.driverLeft?.user.lastName}
                            </styled.h4>
                            <styled.div fontSize="sm" color="gray.300">
                              Starting: {opponentStartingElo.toFixed(3)}
                            </styled.div>
                            <styled.div fontSize="sm" color="gray.300">
                              Final: {opponentElo.toFixed(3)}
                            </styled.div>
                            <styled.div
                              fontSize="sm"
                              color={
                                opponentPointsChange >= 0
                                  ? "green.400"
                                  : "red.400"
                              }
                            >
                              Change: {opponentPointsChange >= 0 ? "+" : ""}
                              {opponentPointsChange.toFixed(3)}
                            </styled.div>
                          </Box>
                        </Flex>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </VStack>
        )}

        {tab === TABS.regionalRatings && (
          <Grid gridTemplateColumns="1fr 1fr" gap={4}>
            {Object.values(Regions).map((region) => {
              if (region === Regions.ALL) return null;

              const elo = driver[`elo_${region}`];

              return (
                <Flex
                  key={region}
                  bgGradient="to-b"
                  gradientFrom="gray.900"
                  gradientTo="black"
                  rounded="xl"
                  p={4}
                  borderWidth={1}
                  borderColor="gray.800"
                  alignItems="center"
                >
                  <styled.span fontWeight="semibold">{region}</styled.span>
                  <Spacer />
                  <styled.span>{elo.toFixed(3)}</styled.span>
                  <styled.img
                    src={`/badges/${getDriverRank(1000, 0)}.png`}
                    w={10}
                  />
                </Flex>
              );
            })}
          </Grid>
        )}

        {tab === TABS.posts && driver.Posts.length > 0 && (
          <Flex gap={4} mt={2} flexDir="column">
            {driver.Posts.map((post) => (
              <PostCard key={post.id} post={post} user={user} />
            ))}
          </Flex>
        )}
      </Container>
    </Box>
  );
};

export default Page;
