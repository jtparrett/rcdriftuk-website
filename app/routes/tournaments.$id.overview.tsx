import { TournamentsState } from "~/utils/enums";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { z } from "zod";
import { Box, Center, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { useIsEmbed } from "~/utils/EmbedContext";
import { QualifyingRun } from "~/components/tournament-overview/QualifyingRun";
import { BattleView } from "~/components/tournament-overview/BattleView";
import { FinalResults } from "~/components/tournament-overview/FinalResults";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      judges: {
        orderBy: {
          createdAt: "asc",
        },
      },
      drivers: {
        select: {
          id: true,
          qualifyingPosition: true,
          finishingPosition: true,
          isBye: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              image: true,
              driverId: true,
            },
          },
        },
        orderBy: [
          {
            finishingPosition: "asc",
          },
          {
            qualifyingPosition: "asc",
          },
        ],
      },
      nextBattle: {
        include: {
          BattleVotes: {
            include: {
              judge: {
                include: {
                  user: {
                    select: {
                      image: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          driverLeft: {
            include: {
              user: {
                select: {
                  image: true,
                  firstName: true,
                  lastName: true,
                  driverId: true,
                  elo: true,
                  ranked: true,
                  team: true,
                },
              },
            },
          },
          driverRight: {
            include: {
              user: {
                select: {
                  image: true,
                  firstName: true,
                  lastName: true,
                  driverId: true,
                  elo: true,
                  ranked: true,
                  team: true,
                },
              },
            },
          },
        },
      },
      nextQualifyingLap: {
        include: {
          scores: {
            include: {
              judge: {
                include: {
                  user: {
                    select: {
                      image: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          driver: {
            include: {
              user: {
                select: {
                  image: true,
                  firstName: true,
                  lastName: true,
                  driverId: true,
                  elo: true,
                  ranked: true,
                  team: true,
                },
              },
              laps: true,
            },
          },
        },
      },
    },
  });

  if (!tournament) {
    throw new Response("Not Found", { status: 404 });
  }

  return tournament;
};

export type OverviewLoaderData = Awaited<ReturnType<typeof loader>>;

const TournamentsOverviewPage = () => {
  const tournament = useLoaderData<typeof loader>();
  const isEmbed = useIsEmbed();

  return (
    <Flex
      p={isEmbed ? 0 : 1}
      borderWidth={isEmbed ? 0 : 1}
      rounded="3xl"
      bgColor="gray.900"
      borderColor="gray.800"
      className="main"
      letterSpacing="tight"
    >
      <Box
        flexGrow={1}
        bgColor="black"
        borderWidth={isEmbed ? 0 : 1}
        rounded="2xl"
        borderColor="gray.800"
        className="bg"
        overflow="hidden"
      >
        <Center
          minH="60dvh"
          bgImage="url(/dot-bg.svg)"
          bgRepeat="repeat"
          bgSize="16px"
          bgPosition="center"
          pos="relative"
          zIndex={1}
          rounded="2xl"
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.800"
          bgColor="gray.950"
          _before={{
            content: '""',
            pos: "absolute",
            inset: 0,
            bgGradient: "to-t",
            gradientFrom: "black",
            gradientVia: "rgba(12, 12, 12, 0)",
            gradientTo: "rgba(12, 12, 12, 0)",
            zIndex: -1,
          }}
        >
          {tournament.state === TournamentsState.START && (
            <Box p={6}>
              <styled.h2 fontSize="xl" fontWeight="semibold">
                Waiting to start...
              </styled.h2>
            </Box>
          )}

          {tournament.state === TournamentsState.QUALIFYING &&
            tournament.nextQualifyingLap && (
              <QualifyingRun
                key={tournament.nextQualifyingLapId}
                lap={tournament.nextQualifyingLap}
                judges={tournament.judges}
                scoreFormula={tournament.scoreFormula}
                driverNumbers={tournament.driverNumbers}
              />
            )}

          {tournament.state === TournamentsState.QUALIFYING &&
            tournament.nextQualifyingLapId === null && (
              <Box p={6}>
                <styled.h2 fontSize="xl" fontWeight="semibold">
                  Qualifying Complete
                </styled.h2>
              </Box>
            )}

          {tournament.state === TournamentsState.BATTLES &&
            tournament.nextBattle && (
              <BattleView
                key={tournament.nextBattleId}
                battle={tournament.nextBattle}
                judges={tournament.judges}
                driverNumbers={tournament.driverNumbers}
              />
            )}

          {tournament.state === TournamentsState.BATTLES &&
            !tournament.nextBattle && (
              <Box p={6}>
                <styled.h2 fontSize="xl" fontWeight="semibold">
                  Battles Complete
                </styled.h2>
              </Box>
            )}

          {tournament.state === TournamentsState.END && (
            <FinalResults drivers={tournament.drivers} />
          )}
        </Center>
      </Box>
    </Flex>
  );
};

export default TournamentsOverviewPage;
