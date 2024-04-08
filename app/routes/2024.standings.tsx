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
        driver: {
          include: {
            battleStandings: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    }),

    prisma.driverBattleStandings.findMany({
      orderBy: {
        position: "asc",
      },
    }),
  ]);

  const driverStandingsFinal = drivers
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

  const allDriverStandings = await prisma.driverBattleStandings.findMany({
    orderBy: [
      {
        tournament: "asc",
      },
      { position: "asc" },
    ],
    include: {
      driver: true,
    },
  });

  return {
    driverStandings: driverStandingsFinal,
    allDriverStandings,
  };
};

const Page = () => {
  const { driverStandings, allDriverStandings } =
    useLoaderData<typeof loader>();

  const RoundStandingTable = ({ tournament }: { tournament: string }) => {
    return (
      <Box
        rounded="xl"
        borderWidth={1}
        borderColor="gray.800"
        overflow="hidden"
      >
        <styled.table w="full">
          <styled.thead>
            <styled.tr borderBottomWidth={1} borderColor="gray.800">
              <styled.th p={2} textAlign="left" w={30}>
                #
              </styled.th>
              <styled.th p={2} textAlign="left">
                Driver
              </styled.th>
            </styled.tr>
          </styled.thead>
          <styled.tbody>
            {allDriverStandings
              .filter((s) => s.tournament === tournament)
              .map((standing, i) => {
                const bgColor = i % 2 === 0 ? "gray.900" : "transparent";
                return (
                  <styled.tr key={standing.id} bgColor={bgColor}>
                    <styled.td p={2}>{standing.position}</styled.td>
                    <styled.td p={2}>
                      <styled.p>
                        {standing.driver.name}{" "}
                        <styled.span color="gray.600">
                          #{standing.driver.champNo}
                        </styled.span>
                      </styled.p>
                      <styled.p fontSize="sm" color="gray.400">
                        {standing.driver.team ?? ""}
                      </styled.p>
                    </styled.td>
                  </styled.tr>
                );
              })}
          </styled.tbody>
        </styled.table>
      </Box>
    );
  };

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

        <Box>
          <styled.h1 fontSize="4xl" fontWeight="extrabold">
            Overall Standings
          </styled.h1>
          <styled.p mb={4} color="gray.500">
            See how the top drivers from accross the championship are ranking
            ahead of the final.
          </styled.p>

          <Box
            rounded="xl"
            borderWidth={1}
            borderColor="gray.800"
            overflow="auto"
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
                  <styled.th>RD1</styled.th>
                  <styled.th>RD2</styled.th>
                  <styled.th>RD3</styled.th>
                  <styled.th>RD4</styled.th>
                  <styled.th>RD5</styled.th>
                  <styled.th>RD6</styled.th>
                  <styled.th textAlign="right" p={2}>
                    Points
                  </styled.th>
                </styled.tr>
              </styled.thead>
              <styled.tbody>
                {driverStandings.map((driver, i) => {
                  const bgColor = i % 2 === 0 ? "gray.900" : "transparent";

                  const round1Standing = driver.driver.battleStandings.find(
                    (t) => t.tournament === "2024-RD1"
                  );
                  const round2Standing = driver.driver.battleStandings.find(
                    (t) => t.tournament === "2024-RD2"
                  );
                  const round3Standing = driver.driver.battleStandings.find(
                    (t) => t.tournament === "2024-RD3"
                  );
                  const round4Standing = driver.driver.battleStandings.find(
                    (t) => t.tournament === "2024-RD4"
                  );
                  const round5Standing = driver.driver.battleStandings.find(
                    (t) => t.tournament === "2024-RD5"
                  );
                  const round6Standing = driver.driver.battleStandings.find(
                    (t) => t.tournament === "2024-RD6"
                  );

                  return (
                    <styled.tr bgColor={bgColor} key={driver.driver.id}>
                      <styled.td p={2}>{i + 1}</styled.td>
                      <styled.td p={2}>
                        <styled.p>
                          {driver.driver.name}{" "}
                          <styled.span color="gray.600">
                            #{driver.driver.champNo}
                          </styled.span>
                        </styled.p>
                        <styled.p fontSize="sm" color="gray.400">
                          {driver.driver.team ?? ""}
                        </styled.p>
                      </styled.td>
                      <styled.td textAlign="center">
                        {round1Standing
                          ? getBattlePoints(round1Standing.position)
                          : "-"}{" "}
                        {round1Standing &&
                          round1Standing?.qualiBonus > 0 &&
                          `+${round1Standing?.qualiBonus}`}
                      </styled.td>
                      <styled.td textAlign="center">
                        {round2Standing
                          ? getBattlePoints(round2Standing.position)
                          : "-"}
                        {round2Standing &&
                          round2Standing?.qualiBonus > 0 &&
                          `+${round2Standing?.qualiBonus}`}
                      </styled.td>
                      <styled.td textAlign="center">
                        {round3Standing
                          ? getBattlePoints(round3Standing.position)
                          : "-"}
                        {round3Standing &&
                          round3Standing?.qualiBonus > 0 &&
                          `+${round3Standing?.qualiBonus}`}
                      </styled.td>
                      <styled.td textAlign="center">
                        {round4Standing
                          ? getBattlePoints(round4Standing.position)
                          : "-"}
                        {round4Standing &&
                          round4Standing?.qualiBonus > 0 &&
                          `+${round4Standing?.qualiBonus}`}
                      </styled.td>
                      <styled.td textAlign="center">
                        {round5Standing
                          ? getBattlePoints(round5Standing.position)
                          : "-"}
                        {round5Standing &&
                          round5Standing?.qualiBonus > 0 &&
                          `+${round5Standing?.qualiBonus}`}
                      </styled.td>
                      <styled.td textAlign="center">
                        {round6Standing
                          ? getBattlePoints(round6Standing.position)
                          : "-"}
                        {round6Standing &&
                          round6Standing?.qualiBonus > 0 &&
                          `+${round6Standing?.qualiBonus}`}
                      </styled.td>
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

        <Box mt={10}>
          <styled.h1 fontSize="4xl" fontWeight="extrabold">
            Round 1 Standings
          </styled.h1>
          <RoundStandingTable tournament="2024-RD1" />
        </Box>

        <Box mt={10}>
          <styled.h1 fontSize="4xl" fontWeight="extrabold">
            Round 2 Standings
          </styled.h1>
          <RoundStandingTable tournament="2024-RD2" />
        </Box>
      </Container>
    </styled.main>
  );
};

export default Page;
