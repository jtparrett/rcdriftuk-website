import { TournamentsState } from "@prisma/client";
import { useMemo, useState } from "react";
import pluralize from "pluralize";
import { RiArrowRightSLine, RiSearchLine } from "react-icons/ri";
import { Link, useLoaderData } from "react-router";
import { Box, Center, Container, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { SDC_USER_ID } from "~/utils/theme";
import { getPositionPoints } from "~/utils/leaderboardPoints";
import { LinkOverlay } from "~/components/LinkOverlay";

export const loader = async () => {
  const leaderboards = await prisma.leaderboards.findMany({
    where: { userId: SDC_USER_ID, archived: false },
    include: {
      tournaments: {
        include: {
          tournament: {
            include: {
              drivers: {
                where: {
                  driverId: { not: 0 },
                  tournament: { state: TournamentsState.END },
                },
                include: { user: true },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return leaderboards.map((lb) => {
    const pointsConfig = getPositionPoints(lb.positionPoints);
    const tqPoints = lb.tqPoints;
    const participationPoints = lb.participationPoints;

    const driverPoints = new Map<
      number,
      {
        points: number;
        user: (typeof lb.tournaments)[0]["tournament"]["drivers"][0]["user"];
        bestQualifying: number | null;
        bestDriverNumber: number | null;
      }
    >();

    for (const lt of lb.tournaments) {
      for (const driver of lt.tournament.drivers) {
        let pts =
          (pointsConfig[driver.finishingPosition ?? 0] ?? 0) +
          participationPoints;

        if (tqPoints > 0 && driver.qualifyingPosition === 1) {
          pts += tqPoints;
        }

        const existing = driverPoints.get(driver.driverId);
        if (existing) {
          existing.points += pts;
          if (driver.qualifyingPosition != null) {
            existing.bestQualifying =
              existing.bestQualifying != null
                ? Math.min(existing.bestQualifying, driver.qualifyingPosition)
                : driver.qualifyingPosition;
          }
          if (driver.tournamentDriverNumber > 0) {
            existing.bestDriverNumber =
              existing.bestDriverNumber != null
                ? Math.min(
                    existing.bestDriverNumber,
                    driver.tournamentDriverNumber,
                  )
                : driver.tournamentDriverNumber;
          }
        } else {
          driverPoints.set(driver.driverId, {
            points: pts,
            user: driver.user,
            bestQualifying: driver.qualifyingPosition,
            bestDriverNumber:
              driver.tournamentDriverNumber > 0
                ? driver.tournamentDriverNumber
                : null,
          });
        }
      }
    }

    const topDrivers = Array.from(driverPoints.values())
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const aQ = a.bestQualifying ?? Infinity;
        const bQ = b.bestQualifying ?? Infinity;
        if (aQ !== bQ) return aQ - bQ;
        const aN = a.bestDriverNumber ?? Infinity;
        const bN = b.bestDriverNumber ?? Infinity;
        return aN - bN;
      })
      .slice(0, 5);

    return {
      id: lb.id,
      name: lb.name,
      tournamentCount: lb.tournaments.length,
      topDrivers,
    };
  });
};

export const meta = () => {
  return [{ title: "SDC 2026 - Regional Standings" }];
};

const Page = () => {
  const leaderboards = useLoaderData<typeof loader>();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leaderboards;
    return leaderboards.filter((lb) => lb.name.toLowerCase().includes(q));
  }, [search, leaderboards]);

  return (
    <Container maxW={800} px={2} py={6}>
      <Box
        borderWidth={1}
        borderColor="gray.800"
        rounded="xl"
        overflow="hidden"
        mb={4}
      >
        <Flex>
          <Center pl={4} color="gray.500">
            <RiSearchLine />
          </Center>
          <styled.input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            bgColor="inherit"
            px={2}
            py={3}
            w="full"
            placeholder="Search regions..."
            color="inherit"
            outline="none"
          />
        </Flex>
      </Box>

      <Flex flexDir="column" gap={4}>
        {filtered.length === 0 && (
          <styled.p textAlign="center" color="gray.500" py={8}>
            No regions found
          </styled.p>
        )}
        {filtered.map((leaderboard) => (
          <Box
            key={leaderboard.id}
            borderWidth={1}
            borderColor="gray.800"
            rounded="2xl"
            overflow="hidden"
          >
            <Flex
              px={6}
              py={5}
              alignItems="center"
              justifyContent="space-between"
              borderBottomWidth={leaderboard.topDrivers.length > 0 ? 1 : 0}
              borderColor="gray.800"
            >
              <Box>
                <styled.h2 fontSize="lg" fontWeight="bold">
                  {leaderboard.name}
                </styled.h2>
                <styled.p fontSize="sm" color="gray.500">
                  {pluralize("tournament", leaderboard.tournamentCount, true)}
                </styled.p>
              </Box>
            </Flex>

            {leaderboard.topDrivers.length > 0 && (
              <Flex flexDir="column">
                {leaderboard.topDrivers.map((driver, i) => (
                  <Flex
                    key={driver.user.driverId}
                    px={6}
                    py={3}
                    alignItems="center"
                    gap={4}
                    borderBottomWidth={
                      i < leaderboard.topDrivers.length - 1 ? 1 : 0
                    }
                    borderColor="gray.800/50"
                    _hover={{ bgColor: "gray.900" }}
                    transition="background-color .15s"
                    pos="relative"
                  >
                    <LinkOverlay to={`/drivers/${driver.user.driverId}`}>
                      <styled.span
                        w={5}
                        textAlign="center"
                        fontWeight="extrabold"
                        fontSize="sm"
                        fontStyle="italic"
                        color={i === 0 ? "brand.500" : "gray.500"}
                      >
                        {i + 1}
                      </styled.span>
                    </LinkOverlay>

                    <Box
                      w={9}
                      h={9}
                      rounded="full"
                      overflow="hidden"
                      borderWidth={2}
                      borderColor={i === 0 ? "brand.500" : "gray.700"}
                      flexShrink={0}
                    >
                      <styled.img
                        src={driver.user.image ?? "/blank-driver-right.jpg"}
                        alt={`${driver.user.firstName} ${driver.user.lastName}`}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    </Box>

                    <Box flex={1} overflow="hidden">
                      <styled.p
                        fontWeight="medium"
                        lineHeight={1.2}
                        whiteSpace="nowrap"
                        textOverflow="ellipsis"
                        overflow="hidden"
                      >
                        {driver.user.firstName} {driver.user.lastName}
                      </styled.p>
                      {driver.user.team && (
                        <styled.p
                          fontSize="xs"
                          color="gray.500"
                          whiteSpace="nowrap"
                          textOverflow="ellipsis"
                          overflow="hidden"
                        >
                          {driver.user.team}
                        </styled.p>
                      )}
                    </Box>

                    <styled.span
                      fontWeight="bold"
                      fontSize="sm"
                      color="gray.300"
                      whiteSpace="nowrap"
                      fontVariantNumeric="tabular-nums"
                    >
                      {driver.points.toFixed(1)} pts
                    </styled.span>
                  </Flex>
                ))}
              </Flex>
            )}

            <Link to={`/leaderboards/${leaderboard.id}`}>
              <Flex
                px={6}
                py={3.5}
                alignItems="center"
                justifyContent="center"
                gap={1}
                borderTopWidth={1}
                borderColor="gray.800"
                color="gray.400"
                fontSize="sm"
                fontWeight="medium"
                _hover={{ bgColor: "gray.900", color: "gray.200" }}
                transition="all .15s"
                cursor="pointer"
              >
                View full standings
                <RiArrowRightSLine />
              </Flex>
            </Link>
          </Box>
        ))}
      </Flex>
    </Container>
  );
};

export default Page;
