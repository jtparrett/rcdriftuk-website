import type { MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { styled, Container, Box } from "~/styled-system/jsx";
import { getDriverRatings } from "~/utils/getDriverRatings";

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
    return (
      <styled.tr>
        <styled.td fontFamily="mono" pl={2} borderTopLeftRadius="lg">
          {rank}
        </styled.td>
        <styled.td h={11}>
          <Link to={`/ratings/${driver.id}`}>
            <styled.span
              display="block"
              lineHeight={1.2}
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              {driver.name}
            </styled.span>
            <styled.span fontSize="xs" color="gray.500" display="block">
              {driver.team}
            </styled.span>
          </Link>
        </styled.td>
        <styled.td textAlign="right" fontFamily="mono">
          {driver.currentElo.toFixed(3)}
        </styled.td>
      </styled.tr>
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
        Calculated using driver battle progression at RCDrift.uk ran
        tournaments.
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
                return <Row key={driver.id} driver={driver} rank={i + 1} />;
              })}
          </tbody>
        </styled.table>
      </Box>
    </Container>
  );
};

export default RatingsPage;
