import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { TournamentsFormat, TournamentsState } from "~/utils/enums";
import { prisma } from "~/utils/prisma.server";
import { getTournamentStandings } from "~/utils/getTournamentStandings";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const battles = await prisma.tournamentBattles.findMany({
    where: {
      tournamentId: id,
      tournament: {
        OR: [
          {
            state: TournamentsState.END,
          },
          {
            format: TournamentsFormat.DRIFT_WARS,
          },
        ],
      },
    },
    orderBy: [
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

const TournamentStandingsPage = () => {
  const drivers = useLoaderData<typeof loader>();

  return (
    <styled.div
      bgColor="gray.900"
      rounded="xl"
      p={4}
      borderWidth={1}
      borderColor="gray.800"
      maxW="600px"
    >
      <styled.table w="full">
        <styled.tbody>
          {drivers.map((driver, index) => (
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
    </styled.div>
  );
};

export default TournamentStandingsPage;
