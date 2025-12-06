import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useState, useEffect, useRef } from "react";
import { Box, Container, Flex, styled, VStack } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUser } from "~/utils/getUser.server";
import { prisma } from "~/utils/prisma.server";
import { adjustDriverElo } from "~/utils/adjustDriverElo.server";
import { getDriverRank } from "~/utils/getDriverRank";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { LinkButton } from "~/components/Button";
import type { Route } from "./+types/2025.wrapped";
import { AppName } from "~/utils/enums";
import { RiArrowRightLine } from "react-icons/ri";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const user = await getUser(userId);

  notFoundInvariant(user, "User not found");

  const driver = await prisma.users.findFirst({
    where: {
      id: userId,
    },
    select: {
      lastBattleDate: true,
      driverId: true,
      firstName: true,
      lastName: true,
      image: true,
      elo: true,
      totalBattles: true,
    },
  });

  notFoundInvariant(driver, "Driver not found");

  // Fetch all rated battles from 2025
  const battles = await prisma.tournamentBattles.findMany({
    where: {
      OR: [
        {
          driverLeft: {
            driverId: driver.driverId,
          },
        },
        {
          driverRight: {
            driverId: driver.driverId,
          },
        },
      ],
      tournament: {
        rated: true,
        createdAt: {
          gte: new Date("2025-01-01"),
          lt: new Date("2026-01-01"),
        },
      },
    },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          createdAt: true,
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

  // Calculate stats
  const totalBattles = battles.length;
  const tournaments = new Set(battles.map((b) => b.tournamentId));
  const totalTournaments = tournaments.size;

  let biggestWin = { points: 0, opponent: "", tournament: "" };
  let biggestLoss = { points: 0, opponent: "", tournament: "" };
  const opponentCounts: Record<string, { name: string; count: number }> = {};
  const tournamentStats: Record<
    string,
    { name: string; wins: number; losses: number }
  > = {};

  battles.forEach((battle) => {
    const isLeftDriver = battle.driverLeft?.driverId === driver.driverId;
    const isWinner = isLeftDriver
      ? battle.winnerId === battle.driverLeft?.id
      : battle.winnerId === battle.driverRight?.id;

    const startingElo = isWinner
      ? battle?.winnerStartingElo ?? 1000
      : battle?.loserStartingElo ?? 1000;
    const endingElo = isWinner
      ? battle?.winnerElo ?? 1000
      : battle?.loserElo ?? 1000;
    const pointsChange = endingElo - startingElo;

    const opponent = isLeftDriver
      ? battle.driverRight?.user
      : battle.driverLeft?.user;
    const opponentName = opponent
      ? `${opponent.firstName} ${opponent.lastName}`
      : "Unknown";

    // Track biggest win and loss
    if (pointsChange > biggestWin.points) {
      biggestWin = {
        points: pointsChange,
        opponent: opponentName,
        tournament: battle.tournament.name,
      };
    }
    if (pointsChange < biggestLoss.points) {
      biggestLoss = {
        points: pointsChange,
        opponent: opponentName,
        tournament: battle.tournament.name,
      };
    }

    // Track opponent frequency
    if (opponent && opponent.driverId !== 0) {
      const opponentId = opponent.driverId.toString();
      if (!opponentCounts[opponentId]) {
        opponentCounts[opponentId] = { name: opponentName, count: 0 };
      }
      opponentCounts[opponentId].count++;
    }

    // Track tournament stats
    const tournamentId = battle.tournamentId.toString();
    if (!tournamentStats[tournamentId]) {
      tournamentStats[tournamentId] = {
        name: battle.tournament.name,
        wins: 0,
        losses: 0,
      };
    }
    if (isWinner) {
      tournamentStats[tournamentId].wins++;
    } else {
      tournamentStats[tournamentId].losses++;
    }
  });

  // Find #1 enemy (most faced opponent)
  const enemy = Object.values(opponentCounts).sort(
    (a, b) => b.count - a.count,
  )[0];

  // Find most successful tournament
  const mostSuccessful = Object.values(tournamentStats).sort(
    (a, b) => b.wins - a.wins || a.losses - b.losses,
  )[0];

  const finalRating = adjustDriverElo(driver.elo, driver.lastBattleDate);
  const rank = getDriverRank(finalRating, driver.totalBattles);

  return {
    driver: {
      ...driver,
      elo: finalRating,
    },
    stats: {
      totalTournaments,
      totalBattles,
      biggestWin: totalBattles > 0 ? biggestWin : null,
      biggestLoss: totalBattles > 0 ? biggestLoss : null,
      enemy: enemy || null,
      mostSuccessful: mostSuccessful || null,
      finalRating,
      rank,
    },
  };
};

export const meta: Route.MetaFunction = () => [
  {
    title: `${AppName} | 2025 Wrapped`,
  },
];

const STORY_DURATION = 5000; // 5 seconds per story

const Page = () => {
  const { driver, stats } = useLoaderData<typeof loader>();
  const [currentStory, setCurrentStory] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // If no battles, show prompt
  if (stats.totalBattles === 0) {
    return (
      <Box
        minH={{
          base: "calc(100dvh - env(safe-area-inset-bottom) - env(safe-area-inset-top) - 128px)",
          md: "calc(100dvh - 100px)",
        }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgGradient="to-b"
        gradientFrom="gray.900"
        gradientTo="black"
        p={4}
      >
        <Container maxW={600}>
          <VStack gap={6} textAlign="center">
            <styled.h1 fontSize="4xl" fontWeight="extrabold">
              Your 2025 Wrapped
            </styled.h1>
            <styled.p fontSize="lg" color="gray.400" maxW={400} mx="auto">
              Looks like you didn't compete in any rated tournaments in 2025.
              Compete in some rated tournaments to see your stats here next
              year!
            </styled.p>
            <LinkButton to="/tournaments">View Tournaments</LinkButton>
          </VStack>
        </Container>
      </Box>
    );
  }

  const stories = [
    {
      title: "Welcome to Your",
      subtitle: "2025 Wrapped",
      content: (
        <VStack gap={4}>
          <Box
            rounded="full"
            overflow="hidden"
            borderWidth={2}
            borderColor="brand.600"
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
          <styled.h2 fontSize="2xl" fontWeight="semibold">
            {driver.firstName} {driver.lastName}
          </styled.h2>
        </VStack>
      ),
    },
    {
      title: "Total Tournaments",
      subtitle: stats.totalTournaments.toString(),
      content: (
        <styled.p fontSize="lg" color="gray.400" textAlign="center" maxW={200}>
          You competed in {stats.totalTournaments} rated tournament
          {stats.totalTournaments === 1 ? "" : "s"} this year
        </styled.p>
      ),
    },
    {
      title: "Total Battles",
      subtitle: stats.totalBattles.toString(),
      content: (
        <styled.p fontSize="lg" color="gray.400" textAlign="center" maxW={200}>
          You went head-to-head {stats.totalBattles} times in 2025
        </styled.p>
      ),
    },
    ...(stats.biggestWin
      ? [
          {
            title: "Biggest Win",
            subtitle: `+${stats.biggestWin.points.toFixed(3)}`,
            content: (
              <VStack gap={2}>
                <styled.p fontSize="lg" color="green.400" textAlign="center">
                  vs {stats.biggestWin.opponent}
                </styled.p>
                <styled.p fontSize="sm" color="gray.500" textAlign="center">
                  {stats.biggestWin.tournament}
                </styled.p>
              </VStack>
            ),
          },
        ]
      : []),
    ...(stats.biggestLoss
      ? [
          {
            title: "Biggest Loss",
            subtitle: `${stats.biggestLoss.points.toFixed(3)}`,
            content: (
              <VStack gap={2}>
                <styled.p fontSize="lg" color="red.400" textAlign="center">
                  vs {stats.biggestLoss.opponent}
                </styled.p>
                <styled.p fontSize="sm" color="gray.500" textAlign="center">
                  {stats.biggestLoss.tournament}
                </styled.p>
              </VStack>
            ),
          },
        ]
      : []),
    ...(stats.enemy
      ? [
          {
            title: "#1 Enemy",
            subtitle: stats.enemy.name,
            content: (
              <styled.p fontSize="lg" color="gray.400" textAlign="center">
                You faced them {stats.enemy.count} time
                {stats.enemy.count === 1 ? "" : "s"} in 2025
              </styled.p>
            ),
          },
        ]
      : []),
    ...(stats.mostSuccessful
      ? [
          {
            title: "Most Successful Tournament",
            subtitle: stats.mostSuccessful.name,
            content: (
              <styled.p fontSize="lg" color="gray.400" textAlign="center">
                {stats.mostSuccessful.wins} win
                {stats.mostSuccessful.wins === 1 ? "" : "s"},{" "}
                {stats.mostSuccessful.losses} loss
                {stats.mostSuccessful.losses === 1 ? "" : "es"}
              </styled.p>
            ),
          },
        ]
      : []),
    {
      title: "Final Rating",
      subtitle: stats.finalRating.toFixed(3),
      content: (
        <VStack gap={4}>
          <Box w={32} h={32} perspective="200px">
            <styled.img
              src={`/badges/${stats.rank}.png`}
              w="full"
              alt={stats.rank}
              animation="badge 4s linear infinite"
            />
          </Box>
          <styled.p fontSize="lg" color="gray.400" textAlign="center">
            {stats.rank.charAt(0).toUpperCase() + stats.rank.slice(1)}
          </styled.p>
        </VStack>
      ),
    },
    {
      title: "2025 Complete",
      subtitle: "See you in 2026!",
      content: (
        <VStack gap={4} pos="relative" zIndex={10}>
          <styled.p fontSize="lg" color="gray.400" textAlign="center">
            Thanks for being part of the RC Drift community
          </styled.p>
          <LinkButton to={`/2026`}>
            2026 Season
            <RiArrowRightLine />
          </LinkButton>
        </VStack>
      ),
    },
  ];

  const currentStoryData = stories[currentStory];

  // Auto-advance stories
  useEffect(() => {
    if (isPaused) return;

    startTimeRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      if (currentStory < stories.length - 1) {
        setCurrentStory((prev) => prev + 1);
      }
    }, STORY_DURATION);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentStory, stories.length, isPaused]);

  const handlePrevious = () => {
    if (currentStory > 0) {
      setCurrentStory(currentStory - 1);
    }
  };

  const handleNext = () => {
    if (currentStory < stories.length - 1) {
      setCurrentStory(currentStory + 1);
    }
  };

  return (
    <Box
      minH={{
        base: "calc(100dvh - env(safe-area-inset-bottom) - env(safe-area-inset-top) - 128px)",
        md: "calc(100dvh - 100px)",
      }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      bgImage="url(/dot-bg.svg)"
      bgRepeat="repeat"
      bgSize="16px"
      bgPosition="center"
      pos="relative"
      overflow="hidden"
      _after={{
        content: '""',
        pos: "absolute",
        inset: 0,
        bgGradient: "to-b",
        gradientFrom: "transparent",
        gradientTo: "black",
        zIndex: 0,
      }}
    >
      <Container w={600} maxW="full" pos="relative" zIndex={1}>
        {/* Progress bars */}
        <Flex gap={1} mb={4}>
          {stories.map((_, index) => (
            <Box
              key={index}
              flex={1}
              h={1}
              bg="gray.800"
              rounded="full"
              overflow="hidden"
              pos="relative"
            >
              <Box
                pos="absolute"
                top={0}
                left={0}
                h="full"
                bg="brand.600"
                rounded="full"
                w={
                  index < currentStory
                    ? "100%"
                    : index === currentStory
                      ? "0%"
                      : "0%"
                }
                animation={
                  index === currentStory && !isPaused
                    ? `progressBar ${STORY_DURATION}ms linear forwards`
                    : undefined
                }
                style={{
                  animationPlayState: isPaused ? "paused" : "running",
                }}
              />
            </Box>
          ))}
        </Flex>

        {/* Story card */}
        <Box
          bgGradient="to-b"
          gradientFrom="gray.900"
          gradientTo="black"
          rounded="2xl"
          borderWidth={1}
          borderColor="gray.800"
          p={8}
          minH="500px"
          display="flex"
          flexDir="column"
          alignItems="center"
          justifyContent="center"
          gap={4}
          pos="relative"
          cursor="pointer"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <Box
            pos="absolute"
            top={0}
            left={0}
            bottom={0}
            w="40%"
            onClick={handlePrevious}
            zIndex={10}
          />
          <Box
            pos="absolute"
            top={0}
            right={0}
            bottom={0}
            w="40%"
            onClick={handleNext}
            zIndex={10}
          />
          <VStack gap={2} textAlign="center">
            <styled.h3 fontSize="lg" color="gray.500" fontWeight="medium">
              {currentStoryData.title}
            </styled.h3>
            <styled.h2 fontSize="5xl" fontWeight="extrabold" lineHeight={1}>
              {currentStoryData.subtitle}
            </styled.h2>
          </VStack>

          {currentStoryData.content}
        </Box>

        {/* Hint text */}
        <styled.p fontSize="sm" color="gray.600" textAlign="center" mt={4}>
          Tap left or right to navigate • Hold to pause
        </styled.p>
      </Container>
    </Box>
  );
};

export default Page;
