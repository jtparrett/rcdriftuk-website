import { Regions, TicketStatus } from "~/utils/enums";
import type { Route } from "./+types/2025";
import { useLoaderData } from "react-router";
import { startOfYear } from "date-fns";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Container, styled, Flex, Box } from "~/styled-system/jsx";
import { getDriverRank, RANKS } from "~/utils/getDriverRank";
import { prisma } from "~/utils/prisma.server";
import { AppName } from "~/utils/enums";
import { adjustDriverElo } from "~/utils/adjustDriverElo.server";
import { MAIN_EVENT_ID } from "./2025.schedule";

export const meta: Route.MetaFunction = () => {
  return [
    { title: `${AppName} | 2025 Standings` },
    {
      name: "description",
      content:
        "Current list of drivers who've qualified for the 2025 Main Event",
    },
    {
      property: "og:image",
      content: "https://rcdrift.io/2025-cover.jpg",
    },
  ];
};

export const loader = async () => {
  const startOfSeason = startOfYear(new Date());

  const qualifiedDrivers = await prisma.users.findMany({
    where: {
      driverId: {
        not: 0,
      },
      TournamentDrivers: {
        some: {
          tournament: {
            rated: true,
            region: Regions.UK,
            createdAt: {
              gte: startOfSeason,
            },
          },
        },
      },
    },
    orderBy: {
      elo_UK: "desc",
    },
    include: {
      EventTickets: {
        where: {
          eventId: MAIN_EVENT_ID,
          status: TicketStatus.CONFIRMED,
        },
      },
    },
  });

  const drivers = qualifiedDrivers
    .map((driver, i) => {
      return {
        ...driver,
        position: i + 1,
        elo_UK: adjustDriverElo(driver.elo_UK, driver.lastBattleDate),
        rank: getDriverRank(driver.elo_UK, driver.totalBattles),
      };
    })
    .filter((a) => {
      return a.rank !== RANKS.UNRANKED;
    });

  return drivers;
};

const StandingsPage = () => {
  const drivers = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={4} py={8}>
      <Box maxW={640} textAlign={{ md: "center" }} mx={{ md: "auto" }}>
        <styled.h1 fontWeight="extrabold" fontSize="4xl">
          2025 Standings
        </styled.h1>

        <styled.p mb={8} textWrap="balance" color="gray.500">
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
            <tbody>
              {drivers.map((driver, i) => (
                <tr
                  key={driver.id}
                  style={{
                    // opacity: i >= 64 ? 0.5 : 1,
                    opacity: driver.EventTickets.length === 0 ? 0.3 : 1,
                    borderTop: i === 64 ? "1px solid red" : undefined,
                  }}
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
                  <styled.td textAlign="right" fontFamily="mono">
                    {driver.elo_UK.toFixed(3)}
                  </styled.td>
                  <styled.td textAlign="right">
                    <styled.img
                      w={8}
                      display="inline-block"
                      src={`/badges/${driver.rank}.png`}
                      alt={`${driver.firstName} ${driver.lastName}'s rank badge`}
                    />
                  </styled.td>
                  <styled.td textAlign="right">
                    {driver.EventTickets.length > 0 ? "Yes" : "No"}
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
