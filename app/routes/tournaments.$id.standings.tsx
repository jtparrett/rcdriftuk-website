import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { TournamentsState } from "~/utils/enums";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const drivers = await prisma.tournamentDrivers.findMany({
    where: {
      tournament: {
        id,
        state: TournamentsState.END,
      },
      driverId: {
        not: 0,
      },
    },
    include: {
      user: true,
    },
    orderBy: {
      finishingPosition: "asc",
    },
  });

  return drivers;
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
          {drivers.map((driver) => (
            <styled.tr key={driver.id}>
              <styled.td textAlign="center" fontFamily="mono" w={8}>
                {driver.finishingPosition}
              </styled.td>
              <styled.td py={1} pl={2}>
                <Flex pos="relative" alignItems="center" gap={2}>
                  <Box w={8} h={8} rounded="full" overflow="hidden">
                    <styled.img
                      rounded="full"
                      src={driver.user.image ?? "/blank-driver-right.jpg"}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>
                  <LinkOverlay to={`/drivers/${driver.driverId}`} />
                  {driver.user.firstName} {driver.user.lastName}
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
