import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { z } from "zod";
import { LinkOverlay } from "~/components/LinkOverlay";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { getTournamentStandings } from "~/utils/getTournamentStandings";
import { LeaderboardType } from "~/utils/enums";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = z.string().parse(params.slug);

  const track = await prisma.tracks.findFirst({
    where: {
      slug,
    },
    include: {
      leaderboard: {
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
      },
    },
  });

  notFoundInvariant(track, "Track not found");

  if (track.leaderboard?.type === LeaderboardType.TOURNAMENTS) {
    const standings = getTournamentStandings(
      track.leaderboard?.tournaments.flatMap(
        (tournament) => tournament.tournament.battles,
      ),
      true,
    );

    return {
      standings,
      leaderboard: track.leaderboard,
    };
  }

  if (track.leaderboard?.type === LeaderboardType.DRIVERS) {
    const standings = track.leaderboard?.drivers.map((driver) => driver.driver);

    return {
      standings,
      leaderboard: track.leaderboard,
    };
  }

  return {
    standings: [],
    leaderboard: track.leaderboard,
  };
};

const TrackLeaderboardPage = () => {
  const { standings, leaderboard } = useLoaderData<typeof loader>();
  const cutoff = leaderboard?.cutoff ?? 0;

  return (
    <Box p={4}>
      {standings.length <= 0 && <styled.p>No tournaments here yet...</styled.p>}

      <styled.table w="full">
        <tbody>
          {standings.map((driver, i) => (
            <tr
              key={driver.driverId}
              style={
                cutoff > 0
                  ? {
                      opacity: i >= cutoff ? 0.5 : 1,
                      borderTop: i === cutoff ? "1px solid red" : undefined,
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
    </Box>
  );
};

export default TrackLeaderboardPage;
