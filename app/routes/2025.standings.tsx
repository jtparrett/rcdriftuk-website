import { Regions } from "@prisma/client";
import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { startOfYear } from "date-fns";
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
  const driverRatings = await getDriverRatings(Regions.ALL);
  const startOfSeason = startOfYear(new Date());

  const qualifiedDrivers = await prisma.users.findMany({
    where: {
      driverId: {
        in: driverRatings
          .map((driver) => driver.driverId)
          .filter((id) => id !== 0),
      },
      TournamentDrivers: {
        some: {
          tournament: {
            rated: true,
            createdAt: {
              gte: startOfSeason,
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
        rank: getDriverRank(driver.elo, driver.totalBattles),
      };
    })
    .filter((a) => {
      return (
        qualifiedDrivers.find((b) => b.driverId === a.driverId) &&
        a.rank !== RANKS.UNRANKED
      );
    });

  // This is awkard, we should've sliced the ratings before the logic above
  // But we can't change it until after 2025 season is over
  return drivers.slice(0, 64);
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
                <tr key={driver.id}>
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
                      <LinkOverlay to={`/ratings/${driver.driverId}`} />
                      {driver.firstName} {driver.lastName}
                    </Flex>
                  </styled.td>
                  <styled.td textAlign="right" fontFamily="mono">
                    {driver.elo.toFixed(3)}
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
