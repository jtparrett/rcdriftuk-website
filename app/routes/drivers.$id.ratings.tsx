import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useState, useMemo } from "react";
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
import { adjustDriverElo } from "~/utils/adjustDriverElo.server";
import { calculateInactivityPenaltyOverPeriod } from "~/utils/inactivityPenalty.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { getBestRegionalElo } from "~/utils/getBestRegionalElo";
import { getRegionName } from "~/utils/enums";

const REGIONS = ["UK", "EU", "NA", "ZA", "LA", "AP"] as const;
type Region = (typeof REGIONS)[number];

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
        { driverLeft: { driverId } },
        { driverRight: { driverId } },
      ],
      tournament: {
        rated: true,
      },
    },
    orderBy: [
      { tournament: { createdAt: "asc" } },
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
          region: true,
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

  const adjusted = {
    elo_UK: adjustDriverElo(driver.elo_UK, driver.lastBattleDate),
    elo_EU: adjustDriverElo(driver.elo_EU, driver.lastBattleDate),
    elo_NA: adjustDriverElo(driver.elo_NA, driver.lastBattleDate),
    elo_ZA: adjustDriverElo(driver.elo_ZA, driver.lastBattleDate),
    elo_LA: adjustDriverElo(driver.elo_LA, driver.lastBattleDate),
    elo_AP: adjustDriverElo(driver.elo_AP, driver.lastBattleDate),
  };
  const { bestElo, bestRegion } = getBestRegionalElo(adjusted);

  return {
    battles,
    driver: {
      ...driver,
      ...adjusted,
      bestElo,
      bestRegion,
      inactivityPenalty: calculateInactivityPenaltyOverPeriod(
        driver.lastBattleDate,
        new Date(),
      ),
    },
  };
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <Box
      bg="gray.900"
      borderWidth={1}
      borderColor="gray.700"
      rounded="lg"
      px={3}
      py={2}
      shadow="xl"
    >
      {data.tournament && (
        <styled.p fontSize="xs" color="gray.400" mb={0.5}>
          {data.tournament}
        </styled.p>
      )}
      <styled.p fontSize="sm" fontWeight="bold" fontFamily="mono">
        {data.elo?.toFixed(3)}
      </styled.p>
      {data.date && (
        <styled.p fontSize="xs" color="gray.500">
          {data.date}
        </styled.p>
      )}
    </Box>
  );
};

const Page = () => {
  const { driver, battles } = useLoaderData<typeof loader>();

  const battlesByRegion = useMemo(() => {
    const map = new Map<string, typeof battles>();
    for (const battle of battles) {
      const region = battle.tournament.region;
      if (!region || region === "ALL") continue;
      if (!map.has(region)) map.set(region, []);
      map.get(region)!.push(battle);
    }
    return map;
  }, [battles]);

  const regionsWithBattles = useMemo(
    () => REGIONS.filter((r) => battlesByRegion.has(r)),
    [battlesByRegion],
  );

  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const activeRegion: Region =
    selectedRegion ?? (driver.bestRegion as Region);

  const chartData = useMemo(() => {
    const regionBattles = battlesByRegion.get(activeRegion) ?? [];

    const points = regionBattles
      .map((battle) => {
        const isLeftDriver =
          battle.driverLeft?.driverId === driver.driverId;
        const isWinner = isLeftDriver
          ? battle.winnerId === battle.driverLeft?.id
          : battle.winnerId === battle.driverRight?.id;

        const elo = isWinner
          ? (battle.winnerRegionalElo ?? battle.winnerElo)
          : (battle.loserRegionalElo ?? battle.loserElo);

        if (elo == null) return null;

        return {
          date: format(battle.tournament.createdAt, "MMM yy"),
          elo,
          tournament: battle.tournament.name,
        };
      })
      .filter(Boolean);

    return [{ elo: 1000, date: "", tournament: "" }, ...points];
  }, [battlesByRegion, activeRegion, driver.driverId]);

  const getRegionElo = (region: Region) =>
    driver[`elo_${region}` as keyof typeof driver] as number;

  const activeElo = getRegionElo(activeRegion);
  const activeRank = getDriverRank(activeElo, driver.ranked);
  const activeBattleCount =
    battlesByRegion.get(activeRegion)?.length ?? 0;

  return (
    <Box>
      <Grid
        gridTemplateColumns="repeat(3, 1fr)"
        gap={2}
      >
        {REGIONS.map((region) => {
          const elo = getRegionElo(region);
          const rank = getDriverRank(elo, driver.ranked);
          const isActive = activeRegion === region;
          const hasBattles = regionsWithBattles.includes(region);
          const isBest = region === driver.bestRegion;

          return (
            <styled.button
              key={region}
              onClick={() => hasBattles && setSelectedRegion(region)}
              cursor={hasBattles ? "pointer" : "default"}
              opacity={hasBattles ? 1 : 0.3}
              bgGradient="to-b"
              gradientFrom={isActive ? "gray.800" : "gray.900"}
              gradientTo="black"
              rounded="xl"
              p={3}
              borderWidth={isActive ? 1.5 : 1}
              borderColor={isActive ? "#ec1a55" : "gray.800"}
              textAlign="left"
              transition="all 0.15s"
              _hover={
                hasBattles
                  ? {
                      borderColor: isActive ? "#ec1a55" : "gray.600",
                    }
                  : undefined
              }
              pos="relative"
              overflow="hidden"
            >
              {isBest && hasBattles && (
                <styled.span
                  pos="absolute"
                  top={1.5}
                  right={2}
                  fontSize="2xs"
                  fontWeight="bold"
                  color="#ec1a55"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Best
                </styled.span>
              )}
              <Flex alignItems="center" gap={1.5} mb={1}>
                <styled.img
                  src={`/badges/${rank}.png`}
                  w={5}
                  h={5}
                />
                <styled.span
                  fontSize="sm"
                  fontWeight="semibold"
                  color={isActive ? "white" : "gray.400"}
                >
                  {region}
                </styled.span>
              </Flex>
              <styled.p
                fontSize="md"
                fontWeight="bold"
                fontFamily="mono"
                color={hasBattles ? "white" : "gray.600"}
              >
                {elo.toFixed(0)}
              </styled.p>
            </styled.button>
          );
        })}
      </Grid>

      <Box
        mt={3}
        borderRadius="xl"
        borderWidth={1}
        borderColor="gray.800"
        bgGradient="to-b"
        gradientFrom="gray.900"
        gradientTo="black"
        overflow="hidden"
      >
        <Flex px={5} pt={5} pb={2} alignItems="flex-start">
          <Box>
            <Flex alignItems="center" gap={2}>
              <styled.p fontSize="sm" color="gray.400">
                {getRegionName(activeRegion)} Rating
              </styled.p>
              <styled.span
                fontSize="xs"
                color="gray.500"
                bg="gray.900"
                px={1.5}
                py={0.5}
                rounded="md"
                borderWidth={1}
                borderColor="gray.800"
              >
                {activeBattleCount} battle
                {activeBattleCount !== 1 ? "s" : ""}
              </styled.span>
            </Flex>
            <Flex alignItems="center" gap={2} mt={1}>
              <styled.p
                fontSize="2xl"
                fontWeight="bold"
                fontFamily="mono"
                lineHeight={1}
              >
                {activeElo.toFixed(3)}
              </styled.p>
            </Flex>
          </Box>
          <Spacer />
          <styled.img
            src={`/badges/${activeRank}.png`}
            w={10}
            h={10}
          />
        </Flex>

        {chartData.length > 1 ? (
          <Box px={2} pb={2}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient
                    id="colorElo"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                  height={60}
                  interval="preserveStartEnd"
                  tick={{ fontSize: 10, fill: "#666" }}
                  axisLine={{ stroke: "#333" }}
                  tickLine={{ stroke: "#333" }}
                />
                <YAxis
                  domain={[
                    (dataMin: number) =>
                      Math.min(1000, Math.floor(dataMin * 0.99)),
                    (dataMax: number) => Math.ceil(dataMax * 1.01),
                  ]}
                  tick={{ fontSize: 10, fill: "#666" }}
                  axisLine={{ stroke: "#333" }}
                  tickLine={{ stroke: "#333" }}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="elo"
                  stroke="#ec1a55"
                  strokeWidth={2}
                  fill="url(#colorElo)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#ec1a55",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Flex
            h={200}
            alignItems="center"
            justifyContent="center"
            pb={4}
          >
            <styled.p color="gray.500" fontSize="sm">
              No rated battles in {getRegionName(activeRegion)}
            </styled.p>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default Page;
