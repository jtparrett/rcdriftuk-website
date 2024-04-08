import { useLoaderData } from "@remix-run/react";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { Box, Container, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

const getBattlePoints = (position: number) => {
  if (position === 1) {
    return 28;
  }

  if (position === 2) {
    return 24;
  }

  if (position === 3) {
    return 21;
  }

  if (position === 4) {
    return 18;
  }

  if (position === 5) {
    return 16;
  }

  if (position === 6) {
    return 14;
  }

  if (position === 7) {
    return 12;
  }

  if (position === 8) {
    return 10;
  }

  if (position <= 16) {
    return 8;
  }

  if (position <= 32) {
    return 4;
  }

  return 0;
};

export const loader = async () => {
  const [drivers, driverStandings] = await prisma.$transaction([
    prisma.driverBattleStandings.findMany({
      distinct: "driverId",
      include: {
        driver: true,
      },
    }),

    prisma.driverBattleStandings.findMany({
      orderBy: {
        position: "asc",
      },
    }),
  ]);

  return drivers
    .map((driver) => {
      const points = driverStandings
        .filter((standing) => standing.driverId === driver.driverId)
        .reduce((agg, i) => {
          return agg + getBattlePoints(i.position) + i.qualiBonus;
        }, 0);

      return {
        driver: driver.driver,
        points,
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        Math.max(...(a.driver.qualiPositions ?? [])) -
          Math.max(...(b.driver.qualiPositions ?? []))
    );
};

const Page = () => {
  const driverStandings = useLoaderData<typeof loader>();

  return (
    <styled.main>
      <Container px={2} maxW={1100}>
        <Breadcrumbs
          paths={[
            {
              to: "/2024/standings",
              title: "Standings",
            },
          ]}
        />

        <Box maxW={800}>
          <styled.h1 fontSize="4xl" fontWeight="extrabold">
            Driver Standings
          </styled.h1>
          <styled.p mb={4} color="gray.500">
            See how the top drivers from accross the championship are ranking
            ahead of the final.
          </styled.p>

          <Box
            rounded="xl"
            borderWidth={1}
            borderColor="gray.800"
            overflow="hidden"
          >
            <styled.table w="full">
              <styled.thead>
                <styled.tr borderBottomWidth={1} borderColor="gray.800">
                  <styled.th p={2} textAlign="left">
                    #
                  </styled.th>
                  <styled.th p={2} textAlign="left">
                    Driver
                  </styled.th>
                  <styled.th p={2} textAlign="left">
                    Team
                  </styled.th>
                  <styled.th textAlign="right" p={2}>
                    Points
                  </styled.th>
                </styled.tr>
              </styled.thead>
              <styled.tbody>
                {driverStandings.map((driver, i) => {
                  const bgColor = i % 2 === 0 ? "gray.900" : "transparent";
                  return (
                    <styled.tr bgColor={bgColor} key={driver.driver.id}>
                      <styled.td p={2}>{i + 1}</styled.td>
                      <styled.td p={2}>
                        {driver.driver.name}{" "}
                        <styled.span color="gray.600">
                          #{driver.driver.champNo}
                        </styled.span>
                      </styled.td>
                      <styled.td p={2}>{driver.driver.team ?? ""}</styled.td>
                      <styled.td p={2} textAlign="right">
                        {driver.points}
                      </styled.td>
                    </styled.tr>
                  );
                })}
              </styled.tbody>
            </styled.table>
          </Box>
        </Box>
      </Container>
    </styled.main>
  );
};

export default Page;
