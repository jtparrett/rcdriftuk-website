import { styled, Box, Center, Flex } from "~/styled-system/jsx";
import type { LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { Fragment } from "react";
import invariant from "~/utils/invariant";
import { z } from "zod";
import { pow2Floor } from "~/utils/powFns";
import { prisma } from "~/utils/prisma.server";
import { sumScores } from "~/utils/sumScores";
import { Glow } from "~/components/Glow";
import { getAuth } from "~/utils/getAuth.server";
import { TournamentsFormat } from "~/utils/enums";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
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
      id: true,
      fullInclusion: true,
      format: true,
      state: true,
      qualifyingLaps: true,
      userId: true,
      scoreFormula: true,
      nextQualifyingLap: {
        select: {
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
          user: {
            select: {
              firstName: true,
              lastName: true,
              driverId: true,
            },
          },
          laps: {
            where: {
              scores: {
                some: {},
              },
            },
            orderBy: {
              id: "asc",
            },
            select: {
              scores: true,
              penalty: true,
            },
          },
        },
      },
    },
  });

  invariant(tournament, "Tournament not found");

  const isOwner = tournament?.userId === userId;

  return {
    isOwner,
    id: tournament.id,
    fullInclusion: tournament.fullInclusion,
    format: tournament.format,
    totalJudges: tournament._count.judges,
    state: tournament.state,
    qualifyingLaps: tournament.qualifyingLaps,
    nextQualifyingDriver: tournament.nextQualifyingLap?.driver,
    drivers: tournament.drivers
      .map((driver) => {
        const lapScores = driver.laps
          .filter((lap) => lap.scores.length === tournament._count.judges)
          .map((lap) =>
            sumScores(
              lap.scores,
              tournament._count.judges,
              tournament.scoreFormula,
              lap.penalty,
            ),
          );

        return {
          ...driver,
          lapScores,
          bestLapScore: lapScores.length > 0 ? Math.max(...lapScores) : null,
        };
      })
      .sort((a, b) => {
        const [bestA, secondA, thirdA] = [...a.lapScores].sort(
          (lapA, lapB) => lapB - lapA,
        );
        const [bestB, secondB, thirdB] = [...b.lapScores].sort(
          (lapA, lapB) => lapB - lapA,
        );

        return (
          bestB - bestA || secondB - secondA || thirdB - thirdA || b.id - a.id
        );
      }),
  };
};

interface TableProps {
  drivers: Awaited<ReturnType<typeof loader>>["drivers"];
  qualifyingCutOff: number;
  startPosition?: number;
  isOwner: boolean;
}

const Table = ({
  drivers,
  qualifyingCutOff,
  startPosition = 0,
  isOwner,
}: TableProps) => {
  const tournament = useLoaderData<typeof loader>();

  return (
    <Box flex={1}>
      <styled.table
        w="full"
        mb={{ base: startPosition <= 0 ? "-32px" : 0, md: 0 }}
      >
        <styled.thead
          bgGradient="to-b"
          gradientFrom="brand.500"
          gradientTo="brand.700"
          visibility={{
            base: startPosition <= 0 ? "visible" : "hidden",
            md: "visible",
          }}
        >
          <styled.tr>
            <styled.th py={1}>#</styled.th>
            <styled.th textAlign="left">Name</styled.th>
            <styled.th>Score</styled.th>
            {Array.from(new Array(tournament.qualifyingLaps)).map((_, i) => (
              <styled.th key={i} whiteSpace="nowrap">
                Run {i + 1}
              </styled.th>
            ))}
          </styled.tr>
        </styled.thead>
        <styled.tbody>
          {drivers.map((driver, i) => {
            return (
              <Fragment key={i}>
                {i + startPosition === qualifyingCutOff &&
                  !tournament.fullInclusion && (
                    <styled.tr>
                      <styled.td colSpan={7}>
                        <Box w="full" h="1px" bgColor="brand.700" />
                      </styled.td>
                    </styled.tr>
                  )}
                <styled.tr key={driver.id}>
                  <styled.td w={16}>
                    <Center>
                      <styled.span fontWeight="semibold">
                        {i + 1 + startPosition}
                      </styled.span>
                    </Center>
                  </styled.td>
                  <styled.td
                    fontWeight="semibold"
                    color={
                      tournament.nextQualifyingDriver?.id === driver.id
                        ? "green.400"
                        : undefined
                    }
                    whiteSpace="nowrap"
                  >
                    <Link to={`/drivers/${driver.user.driverId}`}>
                      {driver.user.firstName} {driver.user.lastName}
                    </Link>
                  </styled.td>

                  <styled.td fontWeight="semibold" textAlign="center">
                    {driver.bestLapScore}
                  </styled.td>

                  {driver.lapScores.map((lapScore, i) => (
                    <styled.td key={i} color="gray.500" textAlign="center">
                      {isOwner ? (
                        <Link
                          to={`/tournaments/${tournament.id}/${driver.id}/${i}`}
                        >
                          {lapScore}
                        </Link>
                      ) : (
                        lapScore
                      )}
                    </styled.td>
                  ))}
                </styled.tr>
              </Fragment>
            );
          })}
        </styled.tbody>
      </styled.table>
    </Box>
  );
};

const QualifyingPage = () => {
  const tournament = useLoaderData<typeof loader>();

  const driversWithoutBuys = tournament.drivers.filter(
    (driver) => !driver.isBye,
  );

  // Wildcard tournaments have one less qualifying driver
  // to leave space for the lower bracket winner (counts for two)
  const qualifyingCutOff =
    pow2Floor(driversWithoutBuys.length) +
    (tournament.format === TournamentsFormat.WILDCARD ? -1 : 0);
  const half = Math.ceil(driversWithoutBuys.length / 2);

  return (
    <Box
      p={1}
      borderWidth={1}
      bgColor="gray.900"
      rounded="2xl"
      borderColor="gray.800"
      pos="relative"
      zIndex={1}
    >
      <Glow />
      <Flex
        bgColor="black"
        flexDir={{ base: "column", md: "row" }}
        borderWidth={1}
        borderColor="brand.700"
        rounded="xl"
        overflow="hidden"
      >
        <Table
          drivers={driversWithoutBuys.slice(0, half)}
          qualifyingCutOff={qualifyingCutOff}
          isOwner={tournament.isOwner}
        />

        <Box
          alignSelf="stretch"
          w="1px"
          backgroundColor="brand.700"
          display={{ base: "none", md: "block" }}
        />

        <Table
          drivers={driversWithoutBuys.slice(half)}
          qualifyingCutOff={qualifyingCutOff}
          startPosition={half}
          isOwner={tournament.isOwner}
        />
      </Flex>
    </Box>
  );
};

export default QualifyingPage;
