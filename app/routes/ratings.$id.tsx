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
  Grid,
  Flex,
  Spacer,
} from "~/styled-system/jsx";
import { getDriverRank, RANKS } from "~/utils/getDriverRank";
import { getDriverRatings } from "~/utils/getDriverRatings";
import { prisma } from "~/utils/prisma.server";
import { useState } from "react";
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import { Button, LinkButton } from "~/components/Button";
import { getDriverAchievements } from "~/utils/getDriverAchievements";
import type { Values } from "~/utils/values";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const driverId = z.coerce.number().parse(params.id);

  const driver = await prisma.users.findFirstOrThrow({
    where: {
      driverId,
    },
  });

  const ratings = await getDriverRatings();
  const driverRatings = ratings.find((r) => r.driverId === driver.driverId);

  return {
    driver,
    driverRatings,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
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
  achievements: "Achievements",
};

const Page = () => {
  const { driver, driverRatings } = useLoaderData<typeof loader>();
  const rank = driverRatings
    ? getDriverRank(driverRatings.currentElo, driverRatings.history.length)
    : RANKS.UNRANKED;

  const [tab, setTab] = useState<Values<typeof TABS>>(TABS.battleHistory);

  const [expandedBattles, setExpandedBattles] = useState<string[]>([]);
  const achievements = getDriverAchievements(driverRatings);

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
        bgImage: "url(/grid-bg.svg)",
        bgSize: "60px",
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
          <LinkButton
            to="/ratings"
            variant="outline"
            size="sm"
            bgColor="gray.800"
          >
            <RiArrowLeftLine /> Back to Ratings
          </LinkButton>

          <Spacer />

          {driverRatings && (
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
                {driverRatings.currentElo.toFixed(3)}
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
          <Button
            flex={1}
            onClick={() => setTab(TABS.achievements)}
            variant={tab === TABS.achievements ? "secondary" : "ghost"}
            px={0}
          >
            Achievements
          </Button>
        </Flex>

        {tab === TABS.achievements && (
          <Box p={1} rounded="2xl" bg="gray.900" mb={8}>
            <Box p={6} borderRadius="xl" borderWidth={1} borderColor="gray.800">
              <styled.h2 fontSize="xl" fontWeight="bold" mb={2}>
                Achievements
              </styled.h2>

              {achievements.length <= 0 && (
                <styled.p color="gray.400">No achievements yet...</styled.p>
              )}

              {achievements.map((achievement) => (
                <styled.img
                  key={achievement}
                  src={`/badges/${achievement}`}
                  w={32}
                />
              ))}
            </Box>
          </Box>
        )}

        {tab === TABS.ratingHistory &&
          driverRatings &&
          driverRatings.history.length > 0 && (
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
                      { date: "Initial", elo: 1000 },
                      ...(driverRatings?.history || []).map((item) => ({
                        date: item.battle.tournament,
                        elo: item.elo,
                        battle: item.battle,
                        startingElo: item.startingElo,
                      })),
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
                        (dataMax: number) => Math.ceil(dataMax * 1.1),
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

        {tab === TABS.battleHistory &&
          driverRatings?.history &&
          driverRatings.history.length > 0 && (
            <VStack gap={2} mt={2} width="100%">
              {driverRatings.history.map(
                ({
                  battle,
                  elo,
                  opponentElo,
                  startingElo,
                  startingOpponentElo,
                  totalBattles,
                  totalOpponentBattles,
                }) => {
                  const isWinner = battle.winnerId === driver.driverId;
                  const isExpanded = expandedBattles.includes(
                    battle.id.toString()
                  );
                  const pointsChange = elo - startingElo;
                  const isByeRun = battle.loserId === 0;
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
                    >
                      <Box
                        borderRadius="xl"
                        overflow="hidden"
                        pos="relative"
                        zIndex={1}
                        borderWidth={1}
                        borderColor={color}
                      >
                        <Flex
                          p={4}
                          cursor="pointer"
                          onClick={() => toggleBattle(battle.id.toString())}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Grid
                            gridTemplateColumns="1fr 2fr 1fr 1fr"
                            gap={6}
                            flex={1}
                          >
                            {/* Tournament Info */}
                            <Box>
                              <styled.h3
                                fontSize="lg"
                                fontWeight="bold"
                                color="gray.200"
                              >
                                {battle.tournament}
                              </styled.h3>
                              <styled.span fontSize="sm" color="gray.400">
                                Battle #{totalBattles}
                              </styled.span>
                            </Box>

                            {/* Opponent Info */}
                            <Box>
                              {!isByeRun && (
                                <styled.span
                                  fontSize="md"
                                  color={isWinner ? "green.400" : "red.400"}
                                >
                                  {isWinner ? "Won vs" : "Lost to"}{" "}
                                  {isWinner
                                    ? battle.loser.firstName +
                                      " " +
                                      battle.loser.lastName
                                    : battle.winner.firstName +
                                      " " +
                                      battle.winner.lastName}
                                </styled.span>
                              )}

                              {isByeRun && (
                                <styled.span fontSize="md" color="yellow.400">
                                  BYE RUN
                                </styled.span>
                              )}
                              <styled.div fontSize="sm" color="gray.400">
                                Opponent Battles: {totalOpponentBattles}
                              </styled.div>
                            </Box>

                            {/* Starting ELO */}
                            <Box>
                              <styled.div fontSize="sm" color="gray.400">
                                Starting ELO
                              </styled.div>
                              <styled.div fontSize="md" color="gray.200">
                                {startingElo.toFixed(0)}
                              </styled.div>
                            </Box>

                            {/* Points Change */}
                            <Flex
                              justifyContent="flex-end"
                              alignItems="center"
                              gap={2}
                            >
                              <styled.span
                                fontSize="xl"
                                fontWeight="bold"
                                color={
                                  pointsChange >= 0 ? "green.400" : "red.400"
                                }
                              >
                                {pointsChange > 0 ? "+" : ""}
                                {pointsChange.toFixed(0)}
                              </styled.span>
                              {isExpanded ? (
                                <RiArrowUpSLine size={20} />
                              ) : (
                                <RiArrowDownSLine size={20} />
                              )}
                            </Flex>
                          </Grid>
                        </Flex>

                        {isExpanded && (
                          <Box
                            p={4}
                            pt={0}
                            borderTop="1px solid"
                            borderColor={color}
                          >
                            <Grid
                              gridTemplateColumns="repeat(3, 1fr)"
                              gap={6}
                              mt={4}
                            >
                              <Box>
                                <styled.h4
                                  fontSize="sm"
                                  fontWeight="bold"
                                  color="gray.400"
                                  mb={2}
                                >
                                  Your Stats
                                </styled.h4>
                                <styled.div fontSize="sm" color="gray.300">
                                  Starting: {startingElo.toFixed(0)}
                                </styled.div>
                                <styled.div fontSize="sm" color="gray.300">
                                  Final: {elo.toFixed(0)}
                                </styled.div>
                                <styled.div
                                  fontSize="sm"
                                  color={
                                    pointsChange >= 0 ? "green.400" : "red.400"
                                  }
                                >
                                  Change: {pointsChange > 0 ? "+" : ""}
                                  {pointsChange.toFixed(0)}
                                </styled.div>
                              </Box>

                              <Box>
                                <styled.h4
                                  fontSize="sm"
                                  fontWeight="bold"
                                  color="gray.400"
                                  mb={2}
                                >
                                  Opponent Stats
                                </styled.h4>
                                <styled.div fontSize="sm" color="gray.300">
                                  Starting: {startingOpponentElo.toFixed(0)}
                                </styled.div>
                                <styled.div fontSize="sm" color="gray.300">
                                  Final: {opponentElo.toFixed(0)}
                                </styled.div>
                                <styled.div
                                  fontSize="sm"
                                  color={
                                    opponentElo - startingOpponentElo >= 0
                                      ? "green.400"
                                      : "red.400"
                                  }
                                >
                                  Change:{" "}
                                  {opponentElo - startingOpponentElo > 0
                                    ? "+"
                                    : ""}
                                  {(opponentElo - startingOpponentElo).toFixed(
                                    0
                                  )}
                                </styled.div>
                              </Box>

                              <Box>
                                <styled.h4
                                  fontSize="sm"
                                  fontWeight="bold"
                                  color="gray.400"
                                  mb={2}
                                >
                                  Battle Details
                                </styled.h4>
                                <styled.div fontSize="sm" color="gray.300">
                                  Your Total Battles: {totalBattles}
                                </styled.div>
                                <styled.div fontSize="sm" color="gray.300">
                                  Opponent Battles: {totalOpponentBattles}
                                </styled.div>
                                <styled.div
                                  fontSize="sm"
                                  color={isWinner ? "green.400" : "red.400"}
                                >
                                  Result: {isWinner ? "Victory" : "Defeat"}
                                </styled.div>
                              </Box>
                            </Grid>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                }
              )}
            </VStack>
          )}
      </Container>
    </Box>
  );
};

export default Page;
