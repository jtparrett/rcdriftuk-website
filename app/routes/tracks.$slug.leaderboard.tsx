import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { z } from "zod";
import { LinkOverlay } from "~/components/LinkOverlay";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { getPositionPoints } from "~/utils/leaderboardPoints";

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
          tournaments: true,
        },
      },
    },
  });

  notFoundInvariant(track, "Track not found");

  if (!track.leaderboard) {
    return { drivers: [], leaderboard: null };
  }

  const pointsConfig = getPositionPoints(track.leaderboard.positionPoints);
  const tqPoints = track.leaderboard.tqPoints;
  const participationPoints = track.leaderboard.participationPoints;
  const tournamentIds = track.leaderboard.tournaments.map((t) => t.tournamentId);

  const rows =
    tournamentIds.length > 0
      ? await prisma.tournamentDrivers.findMany({
          where: {
            tournamentId: { in: tournamentIds },
            driverId: { not: 0 },
          },
          orderBy: [
            { finishingPosition: "asc" },
            { qualifyingPosition: "asc" },
            { id: "asc" },
          ],
          include: {
            user: true,
          },
        })
      : [];

  const byDriver = new Map<
    number,
    {
      user: (typeof rows)[0]["user"];
      totalPoints: number;
      bestQualifying: number | null;
      bestDriverNumber: number | null;
    }
  >();

  for (const row of rows) {
    const pos = row.finishingPosition ?? 0;
    let points = (pointsConfig[pos] ?? 0) + participationPoints;

    if (tqPoints > 0 && row.qualifyingPosition === 1) {
      points += tqPoints;
    }

    const existing = byDriver.get(row.driverId);
    if (existing) {
      existing.totalPoints += points;
      if (row.qualifyingPosition != null) {
        existing.bestQualifying =
          existing.bestQualifying != null
            ? Math.min(existing.bestQualifying, row.qualifyingPosition)
            : row.qualifyingPosition;
      }
      if (row.tournamentDriverNumber > 0) {
        existing.bestDriverNumber =
          existing.bestDriverNumber != null
            ? Math.min(existing.bestDriverNumber, row.tournamentDriverNumber)
            : row.tournamentDriverNumber;
      }
    } else {
      byDriver.set(row.driverId, {
        user: row.user,
        totalPoints: points,
        bestQualifying: row.qualifyingPosition,
        bestDriverNumber:
          row.tournamentDriverNumber > 0 ? row.tournamentDriverNumber : null,
      });
    }
  }

  const drivers = Array.from(byDriver.entries())
    .map(([driverId, { user, totalPoints, bestQualifying, bestDriverNumber }]) => ({
      driverId,
      user,
      totalPoints,
      bestQualifying,
      bestDriverNumber,
    }))
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      const aQ = a.bestQualifying ?? Infinity;
      const bQ = b.bestQualifying ?? Infinity;
      if (aQ !== bQ) return aQ - bQ;
      const aN = a.bestDriverNumber ?? Infinity;
      const bN = b.bestDriverNumber ?? Infinity;
      return aN - bN;
    });

  return {
    drivers,
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
              <styled.td
                textAlign="center"
                fontFamily="mono"
                fontVariantNumeric="tabular-nums"
              >
                {driver.totalPoints.toFixed(1)} pts
              </styled.td>
            </tr>
          ))}
        </tbody>
      </styled.table>
    </Box>
  );
};

export default TrackLeaderboardPage;
