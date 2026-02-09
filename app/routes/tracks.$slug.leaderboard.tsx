import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { z } from "zod";
import { LinkOverlay } from "~/components/LinkOverlay";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { LeaderboardType } from "~/utils/enums";
import { POSITION_POINTS } from "./leaderboards.$id._index";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = z.string().parse(params.slug);

  const track = await prisma.tracks.findFirst({
    where: {
      slug,
    },
    include: {
      leaderboard: {
        include: {
          drivers: {
            orderBy: {
              id: "asc",
            },
            include: {
              driver: true,
            },
          },
          tournaments: true,
        },
      },
    },
  });

  notFoundInvariant(track, "Track not found");

  if (track.leaderboard?.type === LeaderboardType.TOURNAMENTS) {
    const rows = await prisma.tournamentDrivers.findMany({
      where: {
        tournamentId: {
          in: track.leaderboard.tournaments.map((t) => t.tournamentId),
        },
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
      include: {
        user: true,
      },
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

    return {
      drivers,
      leaderboard: track.leaderboard,
    };
  }

  if (track.leaderboard?.type === LeaderboardType.DRIVERS) {
    return {
      drivers: track.leaderboard.drivers.map((d, i) => ({
        driverId: d.driverId,
        user: d.driver,
        totalPoints: POSITION_POINTS[i + 1] ?? 0,
      })),
      leaderboard: track.leaderboard,
    };
  }

  return {
    drivers: [],
    leaderboard: track.leaderboard,
  };
};

const TrackLeaderboardPage = () => {
  const { drivers, leaderboard } = useLoaderData<typeof loader>();
  const cutoff = leaderboard?.cutoff ?? 0;

  return (
    <Box p={4}>
      {drivers.length <= 0 && <styled.p>No tournaments here yet...</styled.p>}

      <styled.table w="full">
        <tbody>
          {drivers.map((driver, i) => (
            <tr
              key={driver.driverId}
              style={
                cutoff > 0
                  ? {
                      opacity: i >= cutoff ? 0.5 : 1,
                      borderTop: i === cutoff ? "1px solid red" : undefined,
                    }
                  : undefined
              }
            >
              <styled.td textAlign="center" fontFamily="mono">
                {i + 1}
              </styled.td>
              <styled.td py={1} pl={2}>
                <Flex pos="relative" alignItems="center" gap={2}>
                  <Box w={8} h={8} rounded="full" overflow="hidden">
                    <styled.img
                      rounded="full"
                      src={driver.user.image ?? "/blank-driver-right.jpg"}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>
                  <LinkOverlay to={`/drivers/${driver.driverId}`} />
                  {driver.user.firstName} {driver.user.lastName}
                </Flex>
              </styled.td>
              <styled.td textAlign="center" fontFamily="mono">
                {driver.totalPoints} pts
              </styled.td>
            </tr>
          ))}
        </tbody>
      </styled.table>
    </Box>
  );
};

export default TrackLeaderboardPage;
