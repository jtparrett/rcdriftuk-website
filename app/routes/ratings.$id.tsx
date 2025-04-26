import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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
} from "~/styled-system/jsx";
import { getDriverRank, RANKS } from "~/utils/getDriverRank";
import { prisma } from "~/utils/prisma.server";
import { useState } from "react";
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import { Button, LinkButton } from "~/components/Button";
import type { Values } from "~/utils/values";
import { format } from "date-fns";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const driverId = z.coerce.number().parse(params.id);

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
      totalBattles: true,
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
                },
              },
            },
          },
        },
      },
    },
  });

  return driver;
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];

  return [
    {
      title: `RC Drift UK | Driver Ratings | ${data.firstName} ${data.lastName}`,
    },
  ];
};

const TABS = {
  battleHistory: "Battle History",
  ratingHistory: "Rating History",
  achievements: "Achievements",
};

const Page = () => {
  const driver = useLoaderData<typeof loader>();
  const battles = driver.TournamentDrivers.flatMap((item) => {
    return [...item.leftBattles, ...item.rightBattles];
  }).sort(
    (a, b) =>
      new Date(a.tournament.createdAt).getTime() -
        new Date(b.tournament.createdAt).getTime() || a.id - b.id
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
        : [...prev, battleId]
    );
  };

  return (
    <Box
      pos="relative"
      zIndex={1}
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
        <Flex alignItems="center">
          <LinkButton to="/ratings" variant="ghost" size="sm">
            <RiArrowLeftLine /> Return to Ratings
          </LinkButton>

          <Spacer />

          {driver && (
            <Flex alignItems="center" gap={2}>
              <Box w={12} h={12} perspective="200px">
                <styled.img
                  src={`/badges/${rank}.png`}
                  w="full"
                  alt={rank}
                  animation="badge 2s linear infinite"
                />
              </Box>
              <styled.span fontSize="lg" fontWeight="bold">
                {driver.elo.toFixed(3)}
              </styled.span>
            </Flex>
          )}
        </Flex>

        <Flex textAlign="center" alignItems="center" flexDir="column" pb={12}>
          <Box p={2} rounded="full" bg="rgba(255, 255, 255, 0.1)">
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

          <styled.h1 fontSize="4xl" fontWeight="bold">
            {driver.firstName} {driver.lastName}
          </styled.h1>

          {driver.team && <styled.p color="gray.300">{driver.team}</styled.p>}
        </Flex>

        <Flex gap={0.5} pb={2} alignItems="center" mx={1}>
          <Button
            flex={1}
            onClick={() => setTab(TABS.battleHistory)}
            variant={tab === TABS.battleHistory ? "secondary" : "ghost"}
            px={0}
          >
            Battle History
          </Button>
          <Button
            flex={1}
            onClick={() => setTab(TABS.ratingHistory)}
            variant={tab === TABS.ratingHistory ? "secondary" : "ghost"}
            px={0}
          >
            Rating History
          </Button>
        </Flex>

        {tab === TABS.ratingHistory &&
          driver &&
          driver.TournamentDrivers.length > 0 && (
            <Box p={1} rounded="2xl" bg="gray.900" mb={8}>
              <Box
                p={6}
                borderRadius="xl"
                borderWidth={1}
                borderColor="gray.800"
              >
                <styled.h2 fontSize="xl" fontWeight="bold" mb={4}>
                  Rating History
                </styled.h2>
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
                  onClick={() => toggleBattle(battle.id.toString())}
                >
                  <Box
                    borderRadius="xl"
                    pos="relative"
                    zIndex={1}
                    borderWidth={1}
                    borderColor={color}
                  >
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

                    <Flex p={4} alignItems="center">
                      <Box flex={1}>
                        <styled.h3
                          fontSize="lg"
                          fontWeight="bold"
                          color="gray.200"
                        >
                          {battle.tournament.name}
                        </styled.h3>

                        {!isByeRun && (
                          <styled.span
                            fontSize="md"
                            color={isWinner ? "green.400" : "red.400"}
                          >
                            {isWinner ? "Won vs" : "Lost to"}{" "}
                            {isWinner
                              ? battle.driverRight?.user.firstName +
                                " " +
                                battle.driverRight?.user.lastName
                              : battle.driverLeft?.user.firstName +
                                " " +
                                battle.driverLeft?.user.lastName}
                          </styled.span>
                        )}

                        {isByeRun && (
                          <styled.span fontSize="md" color="yellow.400">
                            BYE RUN
                          </styled.span>
                        )}
                      </Box>

                      <Flex
                        justifyContent="flex-end"
                        alignItems="center"
                        gap={2}
                        fontSize="lg"
                        fontWeight="semibold"
                      >
                        <styled.span>{startingElo.toFixed(3)}</styled.span>
                        <Box h={4} w="1px" bgColor={color} />
                        <styled.span
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
                    </Flex>

                    {isExpanded && (
                      <Box borderTop="1px solid" borderColor={color}>
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
      </Container>
    </Box>
  );
};

export default Page;
