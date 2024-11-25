import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";
import { Box, Container, HStack, styled, VStack } from "~/styled-system/jsx";
import { getDriverRatings } from "~/utils/getDriverRatings";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const driver = await prisma.drivers.findFirstOrThrow({
    where: {
      id,
    },
  });

  const ratings = await getDriverRatings();

  const driverRatings = ratings.find((r) => r.id === driver.id);

  return {
    driver,
    driverRatings,
  };
};

const Page = () => {
  const { driver, driverRatings } = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={2}>
      <styled.div>
        <styled.h1 mb={4} fontSize="4xl" fontWeight="bold">
          {driver.name}
        </styled.h1>

        {driverRatings && driverRatings.history.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={[
                { date: "Initial", elo: 1000 },
                ...driverRatings.history.map((item) => ({
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
                tickFormatter={(value: any, index: number) => {
                  if (value === "Initial") return value;
                  const uniqueTournaments = new Set(
                    driverRatings.history.map((item) => item.battle.tournament)
                  );
                  return uniqueTournaments.has(value) ? value : "";
                }}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                domain={[
                  (dataMin: number) =>
                    Math.min(1000, Math.floor(dataMin * 0.9)),
                  (dataMax: number) => Math.ceil(dataMax * 1.1),
                ]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;

                    if (data.date === "Initial") {
                      return (
                        <div
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            padding: "10px",
                            border: "1px solid #ccc",
                          }}
                        >
                          <p>Initial Points: 1000</p>
                        </div>
                      );
                    }

                    return (
                      <Box
                        bg="black"
                        color="white"
                        p={3}
                        borderRadius="md"
                        boxShadow="md"
                      >
                        <styled.p fontSize="sm">
                          Tournament: {data.date}
                        </styled.p>
                        <styled.p fontSize="sm">
                          Total Points: {data.elo.toFixed(3)}
                        </styled.p>
                        <styled.p fontSize="sm">
                          Change: {(data.elo - data.startingElo).toFixed(3)}
                        </styled.p>
                        <styled.p fontSize="sm">
                          Winner: {data.battle.winner.name}
                        </styled.p>
                        <styled.p fontSize="sm">
                          Loser: {data.battle.loser.name}
                        </styled.p>
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="elo"
                stroke="#ec1a55"
                fill="url(#colorElo)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {driverRatings?.history.map(
          ({
            battle,
            elo,
            opponentElo,
            startingElo,
            startingOpponentElo,
            totalBattles,
            totalOpponentBattles,
          }) => {
            const isWinner = battle.winnerId === driver.id;

            return (
              <VStack
                key={battle.id}
                bg="gray.900"
                p={2}
                borderRadius="md"
                mb={2}
              >
                <HStack>
                  {isWinner ? (
                    <styled.span color="green">
                      ... VS {battle.loser.name}
                    </styled.span>
                  ) : (
                    <styled.span color="red">
                      ... VS {battle.winner.name}
                    </styled.span>
                  )}
                </HStack>

                <styled.table borderWidth={1} borderColor="gray.800">
                  <thead>
                    <tr>
                      <styled.th />
                      <styled.th p={1}>Driver</styled.th>
                      <styled.th p={1}>Opponent</styled.th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <styled.td p={1}>Tournament</styled.td>
                      <styled.td colSpan={2} p={1} textAlign="center">
                        {battle.tournament}
                      </styled.td>
                    </tr>
                    <tr>
                      <styled.td p={1}>Starting</styled.td>
                      <styled.td p={1}>{startingElo.toFixed(3)}</styled.td>
                      <styled.td p={1}>
                        {startingOpponentElo.toFixed(3)}
                      </styled.td>
                    </tr>
                    <tr>
                      <styled.td p={1}>Elo</styled.td>
                      <styled.td p={1}>{elo.toFixed(3)}</styled.td>
                      <styled.td p={1}>{opponentElo.toFixed(3)}</styled.td>
                    </tr>
                    <tr>
                      <styled.td p={1}>Battles</styled.td>
                      <styled.td p={1}>{totalBattles}</styled.td>
                      <styled.td p={1}>{totalOpponentBattles}</styled.td>
                    </tr>
                    <tr>
                      <styled.td p={1}>Change</styled.td>
                      <styled.td p={1}>
                        {(elo - startingElo).toFixed(3)}
                      </styled.td>
                      <styled.td p={1}>
                        {(opponentElo - startingOpponentElo).toFixed(3)}
                      </styled.td>
                    </tr>
                  </tbody>
                </styled.table>
              </VStack>
            );
          }
        )}
      </styled.div>
    </Container>
  );
};

export default Page;
