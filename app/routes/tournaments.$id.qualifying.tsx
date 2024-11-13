import { styled, Box, Center, Flex } from "~/styled-system/jsx";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Fragment } from "react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { pow2Floor } from "~/utils/powFns";
import { prisma } from "~/utils/prisma.server";
import { sumScores } from "~/utils/sumScores";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          judges: true,
        },
      },
      nextQualifyingLap: {
        include: {
          driver: true,
        },
      },
      drivers: {
        orderBy: {
          id: "asc",
        },
        include: {
          laps: {
            where: {
              scores: {
                some: {},
              },
            },
            orderBy: {
              id: "asc",
            },
            include: {
              scores: true,
            },
          },
        },
      },
    },
  });

  invariant(tournament);

  return {
    totalJudges: tournament._count.judges,
    state: tournament.state,
    qualifyingLaps: tournament.qualifyingLaps,
    nextQualifyingDriver: tournament.nextQualifyingLap?.driver,
    drivers: tournament.drivers
      .map((driver) => {
        const lapScores = driver.laps
          .filter((lap) => lap.scores.length === tournament._count.judges)
          .map((lap) => sumScores(lap.scores, tournament._count.judges));

        return {
          ...driver,
          lapScores,
          bestLapScore: Math.max(...lapScores),
        };
      })
      .sort((a, b) => {
        const [bestA, secondA, thirdA] = [...a.lapScores].sort(
          (lapA, lapB) => lapB - lapA
        );
        const [bestB, secondB, thirdB] = [...b.lapScores].sort(
          (lapA, lapB) => lapB - lapA
        );

        return bestB - bestA || secondB - secondA || thirdB - thirdA;
      }),
  };
};

const QualifyingPage = () => {
  const tournament = useLoaderData<typeof loader>();
  const qualifyingCutOff = pow2Floor(tournament.drivers.length);

  const half = Math.ceil(tournament.drivers.length / 2);

  return (
    <Box p={1} borderWidth={1} rounded="2xl" borderColor="gray.800">
      <Flex
        flexDir={{ base: "column", md: "row" }}
        borderWidth={1}
        borderColor="gray.800"
        py={4}
        rounded="xl"
      >
        <styled.table flex={1}>
          <styled.thead>
            <styled.tr>
              <styled.th>#</styled.th>
              <styled.th textAlign="left">Name</styled.th>
              <styled.th>Best</styled.th>
              {Array.from(new Array(tournament.qualifyingLaps)).map((_, i) => (
                <styled.th key={i} whiteSpace="nowrap">
                  Lap {i + 1}
                </styled.th>
              ))}
            </styled.tr>
          </styled.thead>
          <styled.tbody>
            {[...tournament.drivers].slice(0, half).map((driver, i) => {
              return (
                <Fragment key={i}>
                  {i === qualifyingCutOff && (
                    <styled.tr>
                      <styled.td colSpan={7}>
                        <Box w="full" h="1px" bgColor="red.500" />
                      </styled.td>
                    </styled.tr>
                  )}
                  <styled.tr key={driver.id}>
                    <styled.td fontWeight="bold" w={16}>
                      <Center
                        borderRadius="sm"
                        bgGradient="linear(to-b, red.400, red.700)"
                      >
                        <styled.span fontWeight="bold">{i + 1}</styled.span>
                      </Center>
                    </styled.td>
                    <styled.td
                      fontWeight="bold"
                      color={
                        tournament.nextQualifyingDriver?.id === driver.id
                          ? "green.400"
                          : undefined
                      }
                      whiteSpace="nowrap"
                    >
                      {driver.name}
                    </styled.td>

                    <styled.td fontWeight="black">
                      {driver.bestLapScore}
                    </styled.td>

                    {driver.lapScores.map((lapScore, i) => (
                      <styled.td key={i} color="gray.400">
                        {lapScore}
                      </styled.td>
                    ))}

                    {Array.from(
                      new Array(
                        Math.max(
                          tournament.totalJudges - driver.lapScores.length - 1,
                          0
                        )
                      )
                    ).map((_, i) => (
                      <styled.td key={i} />
                    ))}
                  </styled.tr>
                </Fragment>
              );
            })}
          </styled.tbody>
        </styled.table>

        <Box
          alignSelf="stretch"
          w={0.5}
          backgroundColor="gray.600"
          display={{ base: "none", md: "block" }}
          mx={8}
        />

        <styled.table flex={1}>
          <styled.thead display={{ base: "none", md: "table-header-group" }}>
            <styled.tr>
              <styled.th>#</styled.th>
              <styled.th textAlign="left">Name</styled.th>
              <styled.th>Best</styled.th>
              {Array.from(new Array(tournament.qualifyingLaps)).map((_, i) => (
                <styled.th key={i} whiteSpace="nowrap">
                  Lap {i + 1}
                </styled.th>
              ))}
            </styled.tr>
          </styled.thead>
          <styled.tbody>
            {[...tournament.drivers].slice(half).map((driver, i) => {
              return (
                <Fragment key={i}>
                  {i + half === qualifyingCutOff && (
                    <styled.tr>
                      <styled.td colSpan={7}>
                        <Box w="full" h="1px" bgColor="red.500" />
                      </styled.td>
                    </styled.tr>
                  )}
                  <styled.tr key={driver.id}>
                    <styled.td fontWeight="bold" w={16}>
                      <Center
                        borderRadius="sm"
                        bgGradient="linear(to-b, red.400, red.700)"
                      >
                        <styled.span fontWeight="bold">
                          {i + 1 + half}
                        </styled.span>
                      </Center>
                    </styled.td>
                    <styled.td
                      fontWeight="bold"
                      color={
                        tournament.nextQualifyingDriver?.id === driver.id
                          ? "green.400"
                          : undefined
                      }
                      whiteSpace="nowrap"
                    >
                      {driver.name}
                    </styled.td>

                    <styled.td fontWeight="black">
                      {driver.bestLapScore}
                    </styled.td>

                    {driver.lapScores.map((lapScore, i) => (
                      <styled.td key={i} color="gray.400">
                        {lapScore}
                      </styled.td>
                    ))}

                    {Array.from(
                      new Array(
                        Math.max(
                          tournament.totalJudges - driver.lapScores.length - 1,
                          0
                        )
                      )
                    ).map((_, i) => (
                      <styled.td key={i} />
                    ))}
                  </styled.tr>
                </Fragment>
              );
            })}
          </styled.tbody>
        </styled.table>
      </Flex>
    </Box>
  );
};

export default QualifyingPage;
