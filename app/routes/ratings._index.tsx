import type { MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { styled, Container, Box, Flex } from "~/styled-system/jsx";
import { getDriverRank, RANKS, RANKS_RULES } from "~/utils/getDriverRank";
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
    const rankTitle = driver
      ? getDriverRank(driver.currentElo, driver.history.length)
      : RANKS.UNRANKED;

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
        <styled.td textAlign="right" fontFamily="mono">
          <styled.img
            src={`/badges/${rankTitle}.png`}
            w={8}
            display="inline-block"
            alt={rankTitle}
          />
        </styled.td>
      </styled.tr>
    );
  };

  return (
    <Box
      pos="relative"
      zIndex={1}
      _after={{
        content: '""',
        pos: "absolute",
        top: 0,
        left: 0,
        right: 0,
        h: "100dvh",
        bgImage: "url(/grid-bg.svg)",
        bgSize: "60px",
        bgPosition: "center",
        bgRepeat: "repeat",
        zIndex: -2,
      }}
      _before={{
        content: '""',
        pos: "absolute",
        top: 0,
        left: 0,
        right: 0,
        h: "100dvh",
        bgGradient: "to-t",
        gradientFrom: "black",
        gradientTo: "rgba(12, 12, 12, 0)",
        zIndex: -1,
      }}
    >
      <Container pb={12} px={2} pt={2} maxW={1100}>
        <Box textAlign="center" py={8}>
          <styled.h1 fontSize={{ base: "4xl", md: "5xl" }} fontWeight="black">
            Driver Ratings
          </styled.h1>

          <styled.p
            mb={4}
            color="gray.500"
            textWrap="balance"
            maxW={300}
            mx="auto"
          >
            Discover your ranking among the top drivers in the UK.
          </styled.p>
        </Box>

        <Flex
          gap={4}
          alignItems={{ md: "flex-start" }}
          flexDirection={{ base: "column", md: "row" }}
        >
          <Box
            p={1}
            rounded="2xl"
            borderWidth={1}
            borderColor="gray.800"
            maxW={720}
            flex={1}
            bgColor="black"
          >
            <Box borderWidth={1} borderColor="gray.800" p={4} rounded="xl">
              <styled.table w="full">
                <thead>
                  <tr>
                    <styled.th textAlign="left" pl={2} w="50px">
                      #
                    </styled.th>
                    <styled.th textAlign="left">Name</styled.th>
                    <styled.th textAlign="right">Points</styled.th>
                    <styled.th textAlign="right">Rank</styled.th>
                  </tr>
                </thead>
                <tbody>
                  {drivers
                    .filter((driver) => driver.name !== "BYE")
                    .map((driver, i) => {
                      return (
                        <Row key={driver.id} driver={driver} rank={i + 1} />
                      );
                    })}
                </tbody>
              </styled.table>
            </Box>
          </Box>

          <Box
            p={4}
            borderWidth={1}
            borderColor="gray.800"
            rounded="xl"
            flex="none"
            pos="sticky"
            top="90px"
            bgColor="black"
          >
            {Object.values(RANKS).map((rank) => (
              <Flex key={rank} gap={1} alignItems="center">
                <styled.img src={`/badges/${rank}.png`} w={8} alt={rank} />
                <styled.p fontSize="xs">{RANKS_RULES[rank]}</styled.p>
              </Flex>
            ))}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default RatingsPage;
