import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";
import { Box, styled, Flex, Spacer, Grid } from "~/styled-system/jsx";
import { getDriverRank } from "~/utils/getDriverRank";
import { prisma } from "~/utils/prisma.server";
import { format } from "date-fns";
import { Regions } from "~/utils/enums";
import { adjustDriverElo } from "~/utils/adjustDriverElo.server";
import { calculateInactivityPenaltyOverPeriod } from "~/utils/inactivityPenalty.server";
import notFoundInvariant from "~/utils/notFoundInvariant";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const driverId = z.coerce.number().parse(params.id);

  const driver = await prisma.users.findFirst({
    where: {
      driverId,
    },
    select: {
      ranked: true,
      lastBattleDate: true,
      driverId: true,
      elo: true,
      elo_UK: true,
      elo_EU: true,
      elo_NA: true,
      elo_ZA: true,
      elo_LA: true,
      elo_AP: true,
    },
  });

  notFoundInvariant(driver, "Driver not found");

  const battles = await prisma.tournamentBattles.findMany({
    where: {
      OR: [
        {
          driverLeft: {
            driverId,
          },
        },
        {
          driverRight: {
            driverId,
          },
        },
      ],
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
      { round: "asc" },
      { bracket: "asc" },
      { id: "asc" },
    ],
    include: {
      tournament: {
        select: {
          id: true,
          createdAt: true,
          name: true,
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
  });

  return {
    battles,
    driver: {
      ...driver,
      elo: adjustDriverElo(driver.elo, driver.lastBattleDate),
      elo_UK: adjustDriverElo(driver.elo_UK, driver.lastBattleDate),
      elo_EU: adjustDriverElo(driver.elo_EU, driver.lastBattleDate),
      elo_NA: adjustDriverElo(driver.elo_NA, driver.lastBattleDate),
      elo_ZA: adjustDriverElo(driver.elo_ZA, driver.lastBattleDate),
      elo_LA: adjustDriverElo(driver.elo_LA, driver.lastBattleDate),
      elo_AP: adjustDriverElo(driver.elo_AP, driver.lastBattleDate),
      inactivityPenalty: calculateInactivityPenaltyOverPeriod(
        driver.lastBattleDate,
        new Date(),
      ),
    },
  };
};

const Page = () => {
  const { driver, battles } = useLoaderData<typeof loader>();

  return (
    <Box>
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
                src={`/badges/${getDriverRank(1000, driver.ranked)}.png`}
                w={10}
              />
            </Flex>
          );
        })}
      </Grid>

      <Box
        px={6}
        pt={10}
        borderRadius="xl"
        borderWidth={1}
        borderColor="gray.800"
        bgGradient="to-b"
        gradientFrom="gray.900"
        gradientTo="black"
        mt={4}
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
                (dataMin: number) => Math.min(1000, Math.floor(dataMin * 0.9)),
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
  );
};

export default Page;
