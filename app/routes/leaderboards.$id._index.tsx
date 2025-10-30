import { prisma } from "~/utils/prisma.server";
import {
  useLoaderData,
  useLocation,
  type LoaderFunctionArgs,
} from "react-router";
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
            include: {
              battles: {
                orderBy: [
                  {
                    tournament: {
                      updatedAt: "desc",
                    },
                  },
                  { round: "asc" },
                  { bracket: "asc" },
                  {
                    id: "asc",
                  },
                ],
                select: {
                  id: true,
                  winnerId: true,
                  bracket: true,
                  tournament: {
                    select: {
                      format: true,
                    },
                  },
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
                        },
                      },
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
    const standings = getTournamentStandings(
      leaderboard.tournaments.flatMap(
        (tournament) => tournament.tournament.battles,
      ),
      true,
    );

    return {
      leaderboard,
      standings: standings,
      isOwner,
    };
  }

  return {
    leaderboard,
    standings: leaderboard.drivers.map((driver) => driver.driver),
    isOwner,
  };
};

const LeaderboardsPage = () => {
  const { leaderboard, standings, isOwner } = useLoaderData<typeof loader>();
  const cutoff = leaderboard.cutoff ?? 0;
  const location = useLocation();

  return (
    <>
      <TabsBar>
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

      <Container maxW={1100} px={2} py={4}>
        <Box maxW={640}>
          <styled.div
            bgColor="gray.900"
            rounded="xl"
            p={4}
            borderWidth={1}
            borderColor="gray.800"
          >
            {standings.length === 0 && (
              <styled.p textAlign="center" color="gray.500">
                No results here yet
              </styled.p>
            )}

            {standings.length > 0 && (
              <styled.table w="full">
                <tbody>
                  {standings.map((driver, i) => (
                    <tr
                      key={driver.driverId}
                      style={
                        cutoff > 0
                          ? {
                              opacity: i >= cutoff ? 0.5 : 1,
                              borderTop:
                                i === cutoff ? "1px solid red" : undefined,
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
                              src={driver.image ?? "/blank-driver-right.jpg"}
                              w="full"
                              h="full"
                              objectFit="cover"
                            />
                          </Box>
                          <LinkOverlay to={`/drivers/${driver.driverId}`} />
                          {driver.firstName} {driver.lastName}
                        </Flex>
                      </styled.td>
                    </tr>
                  ))}
                </tbody>
              </styled.table>
            )}
          </styled.div>
        </Box>
      </Container>
    </>
  );
};

export default LeaderboardsPage;
