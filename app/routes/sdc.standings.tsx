import { TournamentsState } from "@prisma/client";
import { useLoaderData } from "react-router";
import { Card } from "~/components/CollapsibleCard";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { SDC_USER_ID } from "~/utils/theme";

/** Points per finishing position: 1st=16, 2nd=8, 3rd=4, 4th=2, 5th=1, 6th+=0 */
const POSITION_POINTS: Record<number, number> = {
  1: 16,
  2: 8,
  3: 4,
  4: 2,
  5: 1,
};

export const loader = async () => {
  // Get all SDC leaderboards and which tournaments belong to each
  const sdcLeaderboards = await prisma.leaderboards.findMany({
    where: { userId: SDC_USER_ID },
    include: {
      tournaments: {
        select: { tournamentId: true },
      },
    },
  });

  // Map tournamentId -> list of leaderboardIds (a tournament can be on multiple boards)
  const tournamentToLeaderboardIds = new Map<string, string[]>();
  const allTournamentIds = new Set<string>();
  for (const lb of sdcLeaderboards) {
    for (const t of lb.tournaments) {
      allTournamentIds.add(t.tournamentId);
      const list = tournamentToLeaderboardIds.get(t.tournamentId) ?? [];
      list.push(lb.id);
      tournamentToLeaderboardIds.set(t.tournamentId, list);
    }
  }

  if (allTournamentIds.size === 0) {
    return [];
  }

  const rows = await prisma.tournamentDrivers.findMany({
    where: {
      driverId: { not: 0 },
      tournamentId: { in: Array.from(allTournamentIds) },
      tournament: { state: TournamentsState.END },
    },
    include: { user: true },
    orderBy: [
      { finishingPosition: "asc" },
      { qualifyingPosition: "asc" },
      { id: "asc" },
    ],
  });

  // driverId -> user (same for all rows of that driver)
  const driverUser = new Map<number, (typeof rows)[0]["user"]>();
  // driverId -> leaderboardId -> { points, count } (points and number of events on that board)
  const byDriverByBoard = new Map<
    number,
    Map<string, { points: number; count: number }>
  >();

  for (const row of rows) {
    driverUser.set(row.driverId, row.user);
    const pos = row.finishingPosition ?? 0;
    const points = POSITION_POINTS[pos] ?? 0;
    const leaderboardIds =
      tournamentToLeaderboardIds.get(row.tournamentId) ?? [];

    let driverBoards = byDriverByBoard.get(row.driverId);
    if (!driverBoards) {
      driverBoards = new Map<string, { points: number; count: number }>();
      byDriverByBoard.set(row.driverId, driverBoards);
    }
    for (const lbId of leaderboardIds) {
      const existing = driverBoards.get(lbId) ?? { points: 0, count: 0 };
      driverBoards.set(lbId, {
        points: existing.points + points,
        count: existing.count + 1,
      });
    }
  }

  const leaderboardIdToName = new Map(
    sdcLeaderboards.map((lb) => [lb.id, lb.name]),
  );

  // Home board = most points; if tied (e.g. 0), board they've competed in most
  const drivers = Array.from(byDriverByBoard.entries())
    .map(([driverId, boardStats]) => {
      let homeBoardId: string | null = null;
      let maxPoints = 0;
      let maxCount = 0;
      for (const [lbId, { points, count }] of boardStats) {
        const better =
          points > maxPoints ||
          (points === maxPoints && count > maxCount);
        if (better) {
          maxPoints = points;
          maxCount = count;
          homeBoardId = lbId;
        }
      }
      const totalPoints = maxPoints;
      const user = driverUser.get(driverId)!;
      const homeBoardName =
        homeBoardId != null
          ? leaderboardIdToName.get(homeBoardId) ?? null
          : null;
      return { driverId, user, totalPoints, homeBoardName };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || a.driverId - b.driverId);

  return drivers;
};

const Page = () => {
  const drivers = useLoaderData<typeof loader>();

  return (
    <Container maxW={800} px={2} py={4}>
      <Flex flexDir="column" gap={2}>
        {drivers.map((driver, i) => (
          <Card
            key={driver.driverId}
            pos="relative"
            bgGradient="to-b"
            gradientFrom="gray.900"
            gradientTo="black"
          >
            <Flex p={6} alignItems="center" gap={4}>
              <styled.p
                fontWeight="extrabold"
                fontSize="2xl"
                fontStyle="italic"
              >
                {i + 1}
              </styled.p>

              <Box
                w={10}
                h={10}
                rounded="full"
                overflow="hidden"
                borderWidth={1}
                borderColor="gray.400"
              >
                <styled.img
                  rounded="full"
                  src={driver.user.image ?? "/blank-driver-right.jpg"}
                  w="full"
                  h="full"
                  objectFit="cover"
                />
              </Box>

              <Box flex={1} overflow="hidden">
                <LinkOverlay to={`/drivers/${driver.driverId}`}>
                  <styled.h2 lineHeight={1.1} fontWeight="medium">
                    {driver.user.firstName} {driver.user.lastName}
                  </styled.h2>
                </LinkOverlay>
                <styled.p
                  fontSize="sm"
                  color="gray.500"
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  overflow="hidden"
                >
                  {[driver.homeBoardName, driver.user.team]
                    .filter(Boolean)
                    .join(" · ")}
                </styled.p>
              </Box>

              <styled.p fontWeight="bold" fontSize="lg">
                {driver.totalPoints} pts
              </styled.p>
            </Flex>
          </Card>
        ))}
      </Flex>
    </Container>
  );
};

export default Page;
