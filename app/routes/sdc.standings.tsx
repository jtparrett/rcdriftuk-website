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
  const rows = await prisma.tournamentDrivers.findMany({
    where: {
      driverId: {
        not: 0,
      },
      tournament: {
        state: TournamentsState.END,
        leaderboards: {
          some: {
            leaderboard: {
              userId: SDC_USER_ID,
            },
          },
        },
      },
    },
    include: {
      user: true,
    },
    orderBy: [
      {
        finishingPosition: "asc",
      },
      {
        qualifyingPosition: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  // Group by driverId, sum points from each finishing position
  const byDriver = new Map<
    number,
    { user: (typeof rows)[0]["user"]; totalPoints: number }
  >();

  for (const row of rows) {
    const pos = row.finishingPosition ?? 0;
    const points = POSITION_POINTS[pos] ?? 0;

    const existing = byDriver.get(row.driverId);
    if (existing) {
      existing.totalPoints += points;
    } else {
      byDriver.set(row.driverId, {
        user: row.user,
        totalPoints: points,
      });
    }
  }

  // Sort by total points descending, then by driverId for stable order
  const drivers = Array.from(byDriver.entries())
    .map(([driverId, { user, totalPoints }]) => ({
      driverId,
      user,
      totalPoints,
    }))
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
                  {driver.user.team}
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
