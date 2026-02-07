import { prisma } from "~/utils/prisma.server";
import {
  useLoaderData,
  useLocation,
  type LoaderFunctionArgs,
} from "react-router";
import { Fragment } from "react";
import { z } from "zod";
import { LeaderboardType } from "~/utils/enums";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { getTournamentStandings } from "~/utils/getTournamentStandings";
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

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  const leaderboard = await prisma.leaderboards.findUnique({
    where: {
      id,
    },
    include: {
      drivers: {
        orderBy: {
          id: "asc",
        },
        include: {
          driver: {
            select: {
              firstName: true,
              lastName: true,
              image: true,
              driverId: true,
              team: true,
            },
          },
        },
      },
      tournaments: {
        orderBy: {
          id: "asc",
        },
        include: {
          tournament: {
            select: {
              id: true,
              format: true,
              enableQualifying: true,
              enableBattles: true,
              battles: {
                orderBy: [{ round: "asc" }, { bracket: "asc" }, { id: "asc" }],
                select: {
                  id: true,
                  winnerId: true,
                  bracket: true,
                  round: true,
                  driverLeft: {
                    select: {
                      isBye: true,
                      id: true,
                      qualifyingPosition: true,
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                          image: true,
                          driverId: true,
                          team: true,
                        },
                      },
                    },
                  },
                  driverRight: {
                    select: {
                      isBye: true,
                      id: true,
                      qualifyingPosition: true,
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                          image: true,
                          driverId: true,
                          team: true,
                        },
                      },
                    },
                  },
                },
              },
              drivers: {
                select: {
                  id: true,
                  qualifyingPosition: true,
                  isBye: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      image: true,
                      driverId: true,
                      team: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  notFoundInvariant(leaderboard, "Leaderboard not found");

  const isOwner = leaderboard.userId === userId;

  if (leaderboard.type === LeaderboardType.TOURNAMENTS) {
    const tournaments = leaderboard.tournaments.map((t) => t.tournament);
    const standings = getTournamentStandings(tournaments);

    return {
      leaderboard,
      standings: standings,
      isOwner,
    };
  }

  return {
    leaderboard,
    standings: leaderboard.drivers.map((driver) => ({
      ...driver.driver,
      points: null,
    })),
    isOwner,
  };
};

const LeaderboardsPage = () => {
  const { leaderboard, standings, isOwner } = useLoaderData<typeof loader>();
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
            variant="outline"
            py={1.5}
          >
            Edit <RiEditCircleFill />
          </LinkButton>
        )}
        <Button
          px={2}
          variant="outline"
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
          variant="outline"
        >
          <RiFullscreenFill />
        </LinkButton>
      </TabsBar>

      <Container maxW={800} px={2} py={4}>
        {standings.length === 0 && (
          <styled.p textAlign="center" color="gray.500">
            No results here yet
          </styled.p>
        )}

        <Flex flexDir="column" gap={2}>
          {standings.map((driver, i) => (
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
                      src={driver.image ?? "/blank-driver-right.jpg"}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>

                  <Box flex={1} overflow="hidden">
                    <LinkOverlay to={`/drivers/${driver.driverId}`}>
                      <styled.h2 lineHeight={1.1} fontWeight="medium">
                        {driver.firstName} {driver.lastName}
                      </styled.h2>
                    </LinkOverlay>
                    <styled.p
                      fontSize="sm"
                      color="gray.500"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                      overflow="hidden"
                    >
                      {driver.team}
                    </styled.p>
                  </Box>

                  <Box
                    rounded="full"
                    bgColor="gray.950"
                    py={1}
                    px={2}
                    borderWidth={1}
                    borderColor="gray.800"
                  >
                    <styled.p fontFamily="mono" fontSize="xs">
                      {driver.points} Points
                    </styled.p>
                  </Box>
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
