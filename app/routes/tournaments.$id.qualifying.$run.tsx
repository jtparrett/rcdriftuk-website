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
import { HiddenEmbed } from "~/utils/EmbedContext";
import { Tab, TabGroup } from "~/components/Tab";
import { token } from "~/styled-system/tokens";

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
      id: true,
      fullInclusion: true,
      format: true,
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
              id: true,
            },
          },
        },
      },
    },
  });

  invariant(tournament, "Tournament not found");

  const isOwner = tournament?.userId === userId;

  return {
    run,
    isOwner,
    id: tournament.id,
    fullInclusion: tournament.fullInclusion,
    format: tournament.format,
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

        const best = lapScores.length > 0 ? Math.max(...lapScores) : null;

        return {
          ...driver,
          score: [best, ...lapScores][run],
          lapId: driver.laps[run - 1]?.id,
        };
      })
      .sort((a, b) => {
        return (b.score ?? 0) - (a.score ?? 0) || a.id - b.id;
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
    <Box flex={1} p={{ base: 0, md: 1 }} overflow="hidden">
      {drivers.map((driver, i) => {
        const isNext = tournament.nextQualifyingDriver?.id === driver.id;

        return (
          <Fragment key={i}>
            {i + startPosition === qualifyingCutOff &&
              !tournament.fullInclusion &&
              tournament.run === 0 && (
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
                <Link to={`/drivers/${driver.user.driverId}`}>
                  {driver.user.firstName} {driver.user.lastName}
                </Link>
              </styled.p>

              <styled.p fontWeight="semibold" textAlign="right">
                {isOwner && tournament.run > 0 ? (
                  <Link
                    to={`/tournaments/${tournament.id}/lap/${driver.lapId}`}
                  >
                    {driver.score}
                  </Link>
                ) : (
                  driver.score
                )}
              </styled.p>
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

  // Wildcard tournaments have one less qualifying driver
  // to leave space for the lower bracket winner (counts for two)
  const qualifyingCutOff =
    pow2Floor(driversWithoutBuys.length) +
    (tournament.format === TournamentsFormat.WILDCARD ? -1 : 0);

  const half = Math.ceil(driversWithoutBuys.length / 2);

  return (
    <>
      <HiddenEmbed>
        <TabGroup mb={4}>
          <Tab
            to={`/tournaments/${tournament.id}/qualifying/0`}
            isActive={tournament.run === 0}
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
          <Table
            drivers={driversWithoutBuys.slice(0, half)}
            qualifyingCutOff={qualifyingCutOff}
            isOwner={tournament.isOwner}
          />

          <Box
            alignSelf="stretch"
            w="1px"
            bgColor="gray.800"
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
    </>
  );
};

export default QualifyingPage;
