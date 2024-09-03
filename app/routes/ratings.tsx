import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { styled, Container, Box } from "~/styled-system/jsx";
import { getDriverRatings } from "~/utils/getDriverRatings";
import { useDisclosure } from "~/utils/useDisclosure";

export const meta: MetaFunction = () => {
  return [
    {
      title: `RC Drift UK | Driver Ratings`,
      description:
        "RC Drift UK Ratings, see where you rank amoungst some of the best drivers in the UK.",
      "og:title": "RC Drift UK | Driver Ratings",
      "og:description":
        "RC Drift UK Ratings, see where you rank amoungst some of the best drivers in the UK.",
    },
  ];
};

export const loader = async () => {
  const drivers = await getDriverRatings();
  return drivers;
};

type LoaderData = typeof loader;

const RatingsPage = () => {
  const drivers = useLoaderData<LoaderData>();

  const Row = ({
    driver,
    rank,
  }: {
    driver: Awaited<ReturnType<LoaderData>>[number];
    rank: number;
  }) => {
    const { isOpen, toggle } = useDisclosure();

    return (
      <>
        <styled.tr
          backgroundColor={isOpen ? "gray.900" : undefined}
          onClick={() => toggle()}
        >
          <styled.td fontFamily="mono" pl={2} borderTopLeftRadius="lg">
            {rank}
          </styled.td>
          <td>
            <styled.span display="block" lineHeight={1.2}>
              {driver.name}
            </styled.span>
            <styled.span fontSize="xs" color="gray.500" display="block">
              {driver.team}
            </styled.span>
          </td>
          <styled.td textAlign="right" fontFamily="mono">
            {driver.points.toFixed(3)}
          </styled.td>
          <styled.td w={50} borderTopRightRadius="lg">
            <Box p={3} fontSize="2xl">
              {isOpen ? <HiChevronUp /> : <HiChevronDown />}
            </Box>
          </styled.td>
        </styled.tr>
        {isOpen && (
          <>
            <styled.tr>
              <td colSpan={4}>
                <Box
                  px={4}
                  py={2}
                  borderTopWidth={1}
                  borderColor="gray.800"
                  backgroundColor="gray.900"
                  mb={2}
                  borderBottomRadius="lg"
                >
                  {driver.breakdown.map((item) => {
                    const [left, right] =
                      item.battle.winnerId === driver.id
                        ? [item.battle.winner, item.battle.loser]
                        : [item.battle.loser, item.battle.winner];

                    return (
                      <p key={item.battle.id}>
                        <styled.span
                          px={1}
                          rounded="sm"
                          fontWeight="semibold"
                          bgColor={
                            left?.id === item.battle.winnerId
                              ? "green.600"
                              : "red.700"
                          }
                        >
                          ...
                        </styled.span>{" "}
                        <styled.span color="gray.400">vs</styled.span>{" "}
                        <styled.span
                          rounded="sm"
                          px={1}
                          bgColor={
                            right?.id === item.battle.winnerId
                              ? "green.600"
                              : "red.700"
                          }
                        >
                          {right?.name}
                        </styled.span>{" "}
                        - {item.points.toFixed(3)} - {item.battle.tournament}
                      </p>
                    );
                  })}
                </Box>
              </td>
            </styled.tr>
            <styled.tr>
              <td colSpan={4}>
                <Box
                  px={4}
                  py={2}
                  borderTopWidth={1}
                  borderColor="gray.800"
                  backgroundColor="gray.900"
                  mb={2}
                  borderBottomRadius="lg"
                >
                  {driver.breakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={[
                          { date: "Initial", points: 1000 },
                          ...driver.breakdown.map((item, index) => ({
                            date: item.battle.tournament,
                            points: item.points,
                            battle: item.battle,
                          })),
                        ]}
                        margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                      >
                        <XAxis
                          dataKey="date"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval="preserveStartEnd"
                          tickFormatter={(value: any, index: number) => {
                            if (value === "Initial") return value;
                            const uniqueTournaments = new Set(
                              driver.breakdown.map(
                                (item) => item.battle.tournament
                              )
                            );
                            return uniqueTournaments.has(value) ? value : "";
                          }}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          domain={[
                            (dataMin: number) =>
                              Math.min(1000, Math.floor(dataMin * 0.9)),
                            (dataMax: number) => Math.ceil(dataMax * 1.1),
                          ]}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              if (data.date === "Initial") {
                                return (
                                  <div
                                    style={{
                                      backgroundColor:
                                        "rgba(255, 255, 255, 0.8)",
                                      padding: "10px",
                                      border: "1px solid #ccc",
                                    }}
                                  >
                                    <p>Initial Points: 1000</p>
                                  </div>
                                );
                              }
                              const index = driver.breakdown.findIndex(
                                (item) => item.battle.id === data.battle.id
                              );
                              const prevData =
                                index > 0
                                  ? driver.breakdown[index - 1]
                                  : { points: 1000 };
                              const pointsDifference = (
                                data.points - prevData.points
                              ).toFixed(3);
                              return (
                                <Box
                                  bg="black"
                                  color="white"
                                  p={3}
                                  borderRadius="md"
                                  boxShadow="md"
                                >
                                  <styled.p fontSize="sm">
                                    Tournament: {data.date}
                                  </styled.p>
                                  <styled.p fontSize="sm">
                                    Total Points: {data.points.toFixed(3)}
                                  </styled.p>
                                  <styled.p fontSize="sm">
                                    Change: {pointsDifference}
                                  </styled.p>
                                  <styled.p fontSize="sm">
                                    Winner: {data.battle.winner.name}
                                  </styled.p>
                                  <styled.p fontSize="sm">
                                    Loser: {data.battle.loser.name}
                                  </styled.p>
                                </Box>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="points"
                          stroke="#ec1a55"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <styled.p color="gray.500">
                      No data available for chart
                    </styled.p>
                  )}
                </Box>
              </td>
            </styled.tr>
          </>
        )}
      </>
    );
  };

  return (
    <Container pb={12} px={2} pt={2} maxW={1100}>
      <styled.h1 fontSize="4xl" fontWeight="extrabold">
        Driver Ratings
      </styled.h1>

      <styled.p mb={4} color="gray.500">
        See where you rank amoungst some of the best drivers in the UK.
        <br />
        Calculated using driver battle progression at UK ran tournaments.
      </styled.p>

      <Box
        mt={6}
        borderWidth={1}
        borderColor="gray.800"
        p={4}
        maxW={720}
        rounded="md"
      >
        <styled.table w="full">
          <thead>
            <tr>
              <styled.th textAlign="left" pl={2} w="50px">
                #
              </styled.th>
              <styled.th textAlign="left">Name</styled.th>
              <styled.th textAlign="right">Points</styled.th>
              <th />
            </tr>
          </thead>
          <tbody>
            {drivers
              .filter((driver) => driver.name !== "BYE")
              .map((driver, i) => {
                // @ts-ignore
                return <Row key={driver.id} driver={driver} rank={i + 1} />;
              })}
          </tbody>
        </styled.table>
      </Box>
    </Container>
  );
};

export default RatingsPage;
