import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { z } from "zod";
import { getTournamentStandings } from "~/utils/getTournamentStandings";
import { TournamentsState } from "~/utils/enums";
import { LinkOverlay } from "~/components/LinkOverlay";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = z.string().parse(params.slug);

  const battles = await prisma.tournamentBattles.findMany({
    where: {
      tournament: {
        tracks: {
          some: {
            track: {
              slug,
            },
          },
        },
        state: TournamentsState.END,
      },
    },
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
  });

  return getTournamentStandings(battles);
};

const TrackLeaderboardPage = () => {
  const standings = useLoaderData<typeof loader>();

  return (
    <Box p={4}>
      {standings.length <= 0 && <styled.p>No tournaments here yet...</styled.p>}

      <styled.table w="full">
        <styled.tbody>
          {standings.map((driver, index) => (
            <styled.tr key={driver.id}>
              <styled.td textAlign="center" fontFamily="mono" w={8}>
                {index + 1}
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
            </styled.tr>
          ))}
        </styled.tbody>
      </styled.table>
    </Box>
  );
};

export default TrackLeaderboardPage;
