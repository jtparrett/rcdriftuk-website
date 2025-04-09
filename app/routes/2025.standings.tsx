import { TicketStatus } from "@prisma/client";
import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { startOfDay, startOfYear } from "date-fns";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Container, styled, Flex, Box } from "~/styled-system/jsx";
import { getDriverRank, RANKS } from "~/utils/getDriverRank";
import { getDriverRatings } from "~/utils/getDriverRatings";
import { prisma } from "~/utils/prisma.server";

export const meta: MetaFunction = () => {
  return [
    { title: "RC Drift UK | 2025 Standings" },
    {
      name: "description",
      content:
        "Current list of drivers who've qualified for the 2025 Main Event",
    },
    {
      property: "og:image",
      content: "https://rcdrift.uk/2025-cover.jpg",
    },
  ];
};

export const loader = async () => {
  const driverRatings = await getDriverRatings();

  const qualifiedDrivers = await prisma.users.findMany({
    where: {
      EventTickets: {
        some: {
          status: TicketStatus.CONFIRMED,
          event: {
            startDate: {
              gte: startOfYear(new Date()),
            },
            endDate: {
              lte: startOfDay(new Date()),
            },
          },
        },
      },
    },
  });

  const drivers = driverRatings
    .map((driver, i) => {
      return {
        ...driver,
        position: i + 1,
        rank: getDriverRank(driver.currentElo, driver.history.length),
      };
    })
    .filter((a) => {
      return (
        qualifiedDrivers.find((b) => b.driverId === a.driverId) &&
        a.rank !== RANKS.UNRANKED
      );
    });

  return drivers.slice(0, 64);
};

const StandingsPage = () => {
  const drivers = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={2} py={8}>
      <styled.h1 fontWeight="extrabold" fontSize="3xl">
        2025 Standings
      </styled.h1>

      <Box maxW="640px">
        <styled.p mb={4} textWrap="balance">
          See the current list of drivers who've qualified for the 2025 Main
          Event. Visit the season overview for details on the qualification
          criteria.
        </styled.p>

        <styled.div
          bgColor="gray.900"
          rounded="xl"
          p={4}
          borderWidth={1}
          borderColor="gray.800"
        >
          <styled.table w="full">
            <thead>
              <tr>
                <styled.th textAlign="right">#</styled.th>
                <styled.th textAlign="left"></styled.th>
                <styled.th textAlign="left"></styled.th>
                <styled.th textAlign="left"></styled.th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver, i) => (
                <tr key={driver.id}>
                  <styled.td textAlign="right">{i + 1}</styled.td>
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
                      <LinkOverlay to={`/ratings/${driver.driverId}`} />
                      {driver.firstName} {driver.lastName}
                    </Flex>
                  </styled.td>
                  <styled.td textAlign="right">
                    {driver.currentElo.toFixed(3)}
                  </styled.td>
                  <styled.td textAlign="right">
                    <styled.img
                      w={8}
                      display="inline-block"
                      src={`/badges/${driver.rank}.png`}
                      alt={`${driver.firstName} ${driver.lastName}'s rank badge`}
                    />
                  </styled.td>
                </tr>
              ))}
            </tbody>
          </styled.table>
        </styled.div>
      </Box>
    </Container>
  );
};

export default StandingsPage;
