import { styled, Box, Center, Flex } from "~/styled-system/jsx";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { Fragment } from "react";
import invariant from "~/utils/invariant";
import { z } from "zod";
import { prisma } from "~/utils/prisma.server";
import { sumScores } from "~/utils/sumScores";
import { Glow } from "~/components/Glow";
import { getAuth } from "~/utils/getAuth.server";
import { TournamentsDriverNumbers } from "~/utils/enums";
import { HiddenEmbed } from "~/utils/EmbedContext";
import { Tab, TabGroup } from "~/components/Tab";
import { token } from "~/styled-system/tokens";
import { LinkOverlay } from "~/components/LinkOverlay";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const run = z.coerce.number().parse(args.params.run);
  const { userId } = await getAuth(args);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    select: {
      _count: {
        select: {
          judges: true,
        },
      },
      judges: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
        },
      },
      id: true,
      enableBattles: true,
      bracketSize: true,
      format: true,
      qualifyingLaps: true,
      userId: true,
      scoreFormula: true,
      driverNumbers: true,
      nextQualifyingLap: {
        select: {
          round: true,
          driver: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      drivers: {
        orderBy: {
          id: "asc",
        },
        select: {
          isBye: true,
          id: true,
          tournamentDriverNumber: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              driverId: true,
            },
          },
          laps: {
            orderBy: {
              id: "asc",
            },
            select: {
              scores: true,
              penalty: true,
              id: true,
              round: true,
            },
          },
        },
      },
    },
  });

  invariant(tournament, "Tournament not found");

  const isOwner = tournament?.userId === userId;
  const judgeIds = tournament.judges.map((j) => j.id);

  return {
    run,
    isOwner,
    id: tournament.id,
    bracketSize: tournament.bracketSize,
    enableBattles: tournament.enableBattles,
    format: tournament.format,
    qualifyingLaps: tournament.qualifyingLaps,
    nextQualifyingDriver: tournament.nextQualifyingLap?.driver,
    nextQualifyingLap: tournament.nextQualifyingLap,
    totalDrivers: tournament.drivers.length,
    driverNumbers: tournament.driverNumbers,
    drivers: tournament.drivers
      .filter(
        (driver) => run === 0 || driver.laps.some((lap) => lap.round === run),
      )
      .map((driver) => {
        const lapScores = driver.laps
          .filter((lap) => lap.scores.length === tournament._count.judges)
          .map((lap) =>
            sumScores(
              lap.scores,
              tournament._count.judges,
              tournament.scoreFormula,
              lap.penalty,
              judgeIds,
            ),
          );

        const best = lapScores.length > 0 ? Math.max(...lapScores) : null;

        return {
          ...driver,
          score: [best, ...lapScores][run],
          lapId: driver.laps[run - 1]?.id,
          scores: lapScores.sort((a, b) => b - a),
        };
      })
      .sort((a, b) => {
        if (run === 0) {
          const [bestA = -1, secondA = -1, thirdA = -1] = [...a.scores].sort(
            (lapA, lapB) => lapB - lapA,
          );
          const [bestB = -1, secondB = -1, thirdB = -1] = [...b.scores].sort(
            (lapA, lapB) => lapB - lapA,
          );

          return (
            bestB - bestA ||
            secondB - secondA ||
            thirdB - thirdA ||
            a.tournamentDriverNumber - b.tournamentDriverNumber
          );
        }

        return (b.score ?? 0) - (a.score ?? 0) || a.id - b.id;
      }),
  };
};

type Drivers = Awaited<ReturnType<typeof loader>>["drivers"];
interface TableProps {
  drivers: Drivers;
  startPosition?: number;
  isOwner: boolean;
  getDriverNumber: (driver: Drivers[number]) => number | undefined;
}

const Table = ({
  drivers,
  startPosition = 0,
  isOwner,
  getDriverNumber,
}: TableProps) => {
  const tournament = useLoaderData<typeof loader>();

  return (
    <Box flex={1} p={{ base: 0, md: 1 }} overflow="hidden">
      {drivers.map((driver, i) => {
        const isNext =
          tournament.nextQualifyingDriver?.id === driver.id &&
          (tournament.run === tournament.nextQualifyingLap?.round ||
            tournament.run === 0);

        const driverNumber = getDriverNumber(driver);

        return (
          <Fragment key={i}>
            {i + startPosition === tournament.bracketSize &&
              tournament.run === 0 &&
              tournament.enableBattles && (
                <Box w="full" h="1px" bgColor="brand.500" />
              )}
            <Flex
              key={driver.id}
              gap={2}
              pos="relative"
              zIndex={0}
              rounded="lg"
              py={0.5}
              pl={0.5}
              pr={3}
              style={
                {
                  "--bg": isNext ? token("colors.brand.900") : undefined,
                } as React.CSSProperties
              }
              bg="var(--bg)"
              _hover={{
                bg: "gray.800",
              }}
              alignItems="center"
            >
              {isNext && <Glow size="sm" />}

              <Center
                w={7}
                h={7}
                bgGradient="to-b"
                gradientFrom="brand.500"
                gradientTo="brand.700"
                rounded="lg"
              >
                <styled.span
                  fontWeight="medium"
                  fontFamily="mono"
                  textAlign="center"
                  fontSize="xs"
                >
                  #{i + 1 + startPosition}
                </styled.span>
              </Center>

              <styled.p
                fontWeight="medium"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                flex={1}
              >
                <LinkOverlay
                  to={
                    isOwner && driver.lapId
                      ? `/tournaments/${tournament.id}/activate/lap/${driver.lapId}`
                      : `/drivers/${driver.user.driverId}`
                  }
                >
                  {driver.user.firstName} {driver.user.lastName}{" "}
                  {driverNumber !== undefined && (
                    <styled.span color="gray.600">
                      ({getDriverNumber(driver)})
                    </styled.span>
                  )}
                </LinkOverlay>
              </styled.p>

              {tournament.run <= 0 && (
                <>
                  {driver.scores.map((score, i) => (
                    <styled.p
                      fontWeight="semibold"
                      textAlign="right"
                      key={score}
                      opacity={i <= 0 ? 1 : 0.5}
                      fontFamily="mono"
                      fontSize="sm"
                    >
                      {score?.toFixed(2).padStart(5, "0")}
                    </styled.p>
                  ))}
                </>
              )}

              {tournament.run > 0 && (
                <styled.p
                  fontWeight="semibold"
                  textAlign="right"
                  fontFamily="mono"
                  fontSize="sm"
                >
                  {driver.score?.toFixed(2).padStart(5, "0")}
                </styled.p>
              )}
            </Flex>
          </Fragment>
        );
      })}
    </Box>
  );
};

const QualifyingPage = () => {
  const tournament = useLoaderData<typeof loader>();

  const driversWithoutBuys = tournament.drivers.filter(
    (driver) => !driver.isBye,
  );

  const half = Math.ceil(driversWithoutBuys.length / 2);

  const getDriverNumber = (driver: Drivers[number]) => {
    if (tournament.driverNumbers === TournamentsDriverNumbers.NONE) {
      return undefined;
    }

    if (tournament.driverNumbers === TournamentsDriverNumbers.UNIVERSAL) {
      return driver.user.driverId;
    }

    return driver.tournamentDriverNumber;
  };

  return (
    <>
      <HiddenEmbed>
        <TabGroup mb={2}>
          <Tab
            to={`/tournaments/${tournament.id}/qualifying/0`}
            isActive={tournament.run === 0}
            data-replace="true"
            replace
          >
            Best
          </Tab>
          {Array.from(new Array(tournament.qualifyingLaps)).map((_, i) => {
            return (
              <Tab
                key={i}
                isActive={tournament.run === i + 1}
                to={`/tournaments/${tournament.id}/qualifying/${i + 1}`}
                data-replace="true"
                replace
              >
                Run {i + 1}
              </Tab>
            );
          })}
        </TabGroup>
      </HiddenEmbed>

      <Box
        borderWidth={1}
        bgColor="gray.900"
        rounded="3xl"
        borderColor="gray.800"
        p={1}
      >
        <Flex
          flexDir={{ base: "column", md: "row" }}
          gap={{ base: 0, md: 2 }}
          p={{ base: 1, md: 0 }}
          borderWidth={1}
          borderColor="gray.800"
          rounded="2xl"
          bg="gray.950"
        >
          {driversWithoutBuys.length <= 0 && (
            <styled.p textAlign="center" flex={1} py={4}>
              There are no runs here yet.
            </styled.p>
          )}

          {driversWithoutBuys.length > 0 && (
            <>
              <Table
                drivers={driversWithoutBuys.slice(0, half)}
                isOwner={tournament.isOwner}
                getDriverNumber={getDriverNumber}
              />

              <Box
                alignSelf="stretch"
                w="1px"
                bgColor="gray.800"
                display={{ base: "none", md: "block" }}
              />

              <Table
                drivers={driversWithoutBuys.slice(half)}
                startPosition={half}
                isOwner={tournament.isOwner}
                getDriverNumber={getDriverNumber}
              />
            </>
          )}
        </Flex>
      </Box>
    </>
  );
};

export default QualifyingPage;
