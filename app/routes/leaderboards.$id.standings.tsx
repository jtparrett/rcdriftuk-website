import { prisma } from "~/utils/prisma.server";
import {
  useLoaderData,
  useLocation,
  type LoaderFunctionArgs,
} from "react-router";
import { Fragment } from "react";
import { z } from "zod";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { LinkOverlay } from "~/components/LinkOverlay";
import { LinkButton } from "~/components/Button";
import { Card } from "~/components/CollapsibleCard";
import { getPositionPoints } from "~/utils/leaderboardPoints";
import { useIsEmbed } from "~/utils/EmbedContext";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const url = new URL(args.request.url);
  const maxParam = url.searchParams.get("max");
  const max = maxParam ? Math.max(1, parseInt(maxParam, 10) || 0) : null;

  const leaderboard = await prisma.leaderboards.findUnique({
    where: { id },
    include: {
      tournaments: {
        orderBy: { id: "asc" },
      },
    },
  });

  notFoundInvariant(leaderboard, "Leaderboard not found");

  const pointsConfig = getPositionPoints(leaderboard.positionPoints);
  const tqPoints = leaderboard.tqPoints;
  const participationPoints = leaderboard.participationPoints;
  const cutoff = leaderboard.cutoff ?? 0;

  const tournamentIds = leaderboard.tournaments.map((t) => t.tournamentId);
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
    .map(
      ([
        driverId,
        { user, totalPoints, bestQualifying, bestDriverNumber },
      ]) => ({
        driverId,
        user,
        totalPoints,
        bestQualifying,
        bestDriverNumber,
      }),
    )
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      const aQ = a.bestQualifying ?? Infinity;
      const bQ = b.bestQualifying ?? Infinity;
      if (aQ !== bQ) return aQ - bQ;
      const aN = a.bestDriverNumber ?? Infinity;
      const bN = b.bestDriverNumber ?? Infinity;
      return aN - bN;
    });

  const totalCount = drivers.length;

  return {
    drivers: max ? drivers.slice(0, max) : drivers,
    cutoff,
    max,
    totalCount,
  };
};

const StandingsPage = () => {
  const { drivers, cutoff, max, totalCount } = useLoaderData<typeof loader>();
  const isEmbed = useIsEmbed();
  const location = useLocation();
  const hasMore = max !== null && totalCount > max;

  return (
    <>
      {drivers.length === 0 && (
        <styled.p textAlign="center" color="gray.500">
          No results here yet
        </styled.p>
      )}

      <Flex flexDir="column" gap={1}>
        {drivers.map((driver, i) => (
          <Fragment key={driver.driverId}>
            {i === cutoff && cutoff > 0 && <Box h="1px" bgColor="red.500" />}

            <Card
              pos="relative"
              bgGradient="to-b"
              gradientFrom="gray.900"
              gradientTo="black"
              opacity={i >= cutoff && cutoff > 0 ? 0.5 : 1}
              rounded="xl"
            >
              <Flex px={4} py={2} alignItems="center" gap={3}>
                <styled.p
                  fontWeight="extrabold"
                  fontSize="xl"
                  fontStyle="italic"
                  fontVariantNumeric="tabular-nums"
                >
                  {i + 1}
                </styled.p>

                <Box
                  w={8}
                  h={8}
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
                  <LinkOverlay
                    to={`/drivers/${driver.driverId}`}
                    target={isEmbed ? "_blank" : undefined}
                  >
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

                <styled.p
                  fontWeight="semibold"
                  fontFamily="mono"
                  fontVariantNumeric="tabular-nums"
                >
                  {driver.totalPoints.toFixed(1)} pts
                </styled.p>
              </Flex>
            </Card>
          </Fragment>
        ))}
      </Flex>

      {hasMore && (
        <LinkButton
          mt={3}
          to={location.pathname}
          target="_blank"
          variant="secondary"
          w="full"
        >
          See More
        </LinkButton>
      )}
    </>
  );
};

export default StandingsPage;
