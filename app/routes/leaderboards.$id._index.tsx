import { prisma } from "~/utils/prisma.server";
import {
  useLoaderData,
  useLocation,
  type LoaderFunctionArgs,
} from "react-router";
import { Fragment } from "react";
import { z } from "zod";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { LinkOverlay } from "~/components/LinkOverlay";
import { getAuth } from "~/utils/getAuth.server";
import { Button, LinkButton } from "~/components/Button";
import {
  RiEditCircleFill,
  RiFullscreenFill,
  RiShareForwardFill,
} from "react-icons/ri";
import { TabsBar } from "~/components/TabsBar";
import { Card } from "~/components/CollapsibleCard";
import { getPositionPoints } from "~/utils/leaderboardPoints";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  const leaderboard = await prisma.leaderboards.findUnique({
    where: {
      id,
    },
    include: {
      tournaments: {
        orderBy: {
          tournament: {
            createdAt: "asc",
          },
        },
      },
    },
  });

  notFoundInvariant(leaderboard, "Leaderboard not found");

  const isOwner = leaderboard.userId === userId;

  const pointsConfig = getPositionPoints(leaderboard.positionPoints);
  const tqPoints = leaderboard.tqPoints;
  const participationPoints = leaderboard.participationPoints;

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
    { user: (typeof rows)[0]["user"]; totalPoints: number }
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
    } else {
      byDriver.set(row.driverId, {
        user: row.user,
        totalPoints: points,
      });
    }
  }

  const drivers = Array.from(byDriver.entries())
    .map(([driverId, { user, totalPoints }]) => ({
      driverId,
      user,
      totalPoints,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.driverId - b.driverId);

  return {
    leaderboard,
    drivers,
    isOwner,
  };
};

const LeaderboardsPage = () => {
  const { leaderboard, drivers, isOwner } = useLoaderData<typeof loader>();
  const cutoff = leaderboard.cutoff ?? 0;
  const location = useLocation();

  return (
    <>
      <TabsBar maxW={800}>
        <styled.h1
          fontSize="lg"
          fontWeight="extrabold"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
          flex={1}
        >
          {leaderboard.name}
        </styled.h1>

        {isOwner && (
          <LinkButton
            to={`/leaderboards/${leaderboard.id}/edit`}
            variant="secondary"
            py={1.5}
          >
            Edit <RiEditCircleFill />
          </LinkButton>
        )}
        <Button
          px={2}
          variant="secondary"
          onClick={() => {
            navigator.share({
              url: `https://rcdrift.io/leaderboards/${leaderboard.id}`,
            });
          }}
        >
          <RiShareForwardFill />
        </Button>
        <LinkButton
          to={location.pathname + "?embed=true"}
          px={2}
          target="_blank"
          variant="secondary"
        >
          <RiFullscreenFill />
        </LinkButton>
      </TabsBar>

      <Container maxW={800} px={2} py={4}>
        {drivers.length === 0 && (
          <styled.p textAlign="center" color="gray.500">
            No results here yet
          </styled.p>
        )}

        <Flex flexDir="column" gap={2}>
          {drivers.map((driver, i) => (
            <Fragment key={driver.driverId}>
              {i === cutoff && cutoff > 0 && <Box h="1px" bgColor="red.500" />}

              <Card
                key={driver.driverId}
                pos="relative"
                bgGradient="to-b"
                gradientFrom="gray.900"
                gradientTo="black"
                opacity={i >= cutoff && cutoff > 0 ? 0.5 : 1}
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

                  <styled.p
                    fontWeight="bold"
                    fontSize="lg"
                    fontVariantNumeric="tabular-nums"
                  >
                    {driver.totalPoints.toFixed(1)} pts
                  </styled.p>
                </Flex>
              </Card>
            </Fragment>
          ))}
        </Flex>
      </Container>
    </>
  );
};

export default LeaderboardsPage;
