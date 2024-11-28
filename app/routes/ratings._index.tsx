import type { MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { styled, Container, Box, Flex } from "~/styled-system/jsx";
import { getDriverRank, RANKS, RANKS_RULES } from "~/utils/getDriverRank";
import { getDriverRatings } from "~/utils/getDriverRatings";
import { RiArrowDownSLine } from "react-icons/ri";
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

const getRankColor = (rank: string) => {
  switch (rank) {
    case RANKS.PLATINUM:
      return {
        bg: "#0C2428",
        hover: "#163B42",
      };
    case RANKS.DIAMOND:
      return {
        bg: "#162037",
        hover: "#1F2E54",
      };
    case RANKS.GOLD:
      return {
        bg: "#3D2F0C",
        hover: "#574511",
      };
    case RANKS.SILVER:
      return {
        bg: "gray.800",
        hover: "gray.700",
      };
    case RANKS.BRONZE:
      return {
        bg: "#2C1810",
        hover: "#462619",
      };
    default:
      return {
        bg: "gray.900",
        hover: "gray.800",
      };
  }
};

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

  const colors = getRankColor(rankTitle);

  return (
    <styled.tr
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        backgroundColor: colors.hover,
        transform: "scale(1.01)",
      }}
      backgroundColor={colors.bg}
      bg={colors.bg}
      style={{
        backgroundColor: colors.bg,
      }}
      role="link"
      borderWidth="1px"
      borderColor="gray.800"
      _active={{
        transform: "scale(0.99)",
      }}
      shadow="lg"
    >
      <styled.td fontFamily="mono" pl={4} py={4} borderLeftRadius="xl">
        {rank}
      </styled.td>
      <styled.td py={4}>
        <Link to={`/ratings/${driver.driverId}`} style={{ display: "block" }}>
          <Flex alignItems="center" gap={2}>
            <Box flex={1}>
              <styled.span
                display="block"
                lineHeight={1.2}
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
                fontWeight="semibold"
              >
                {driver.firstName} {driver.lastName}
              </styled.span>
              <styled.span fontSize="xs" color="gray.500" display="block">
                {driver.team}
              </styled.span>
            </Box>
          </Flex>
        </Link>
      </styled.td>
      <styled.td textAlign="right" py={4} fontFamily="mono">
        {driver.currentElo.toFixed(3)}
      </styled.td>
      <styled.td
        textAlign="right"
        py={4}
        pr={4}
        borderRightRadius="xl"
        fontFamily="mono"
      >
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

const RankSection = () => {
  const keyDisclosure = useDisclosure();

  return (
    <Box
      p={1}
      rounded="2xl"
      borderWidth={1}
      borderColor="gray.900"
      w="full"
      bgColor="black"
    >
      <Box
        borderWidth={1}
        borderColor="gray.900"
        rounded="xl"
        bgColor="gray.900"
      >
        <Flex
          p={4}
          alignItems="center"
          justifyContent="space-between"
          cursor="pointer"
          onClick={keyDisclosure.toggle}
          _hover={{
            bgColor: "gray.800",
          }}
        >
          <styled.h2 fontSize="lg" fontWeight="semibold">
            View Ranks
          </styled.h2>
          <Box
            transform={keyDisclosure.isOpen ? "rotate(180deg)" : "none"}
            transition="transform 0.2s"
            color="gray.400"
          >
            <RiArrowDownSLine size={24} />
          </Box>
        </Flex>

        {keyDisclosure.isOpen && (
          <Box borderTopWidth={1} borderColor="gray.800" p={4}>
            <Flex gap={4} flexWrap="wrap" justifyContent="space-between">
              {Object.values(RANKS).map((rank) => {
                const colors = getRankColor(rank);
                return (
                  <Flex
                    key={rank}
                    gap={3}
                    alignItems="center"
                    minW="150px"
                    flex={1}
                    p={2}
                    borderWidth={1}
                    borderColor="gray.800"
                    rounded="lg"
                    backgroundColor={colors.bg}
                    bg={colors.bg}
                    style={{
                      backgroundColor: colors.bg,
                    }}
                  >
                    <styled.img src={`/badges/${rank}.png`} w={8} alt={rank} />
                    <styled.p fontSize="sm" fontWeight="medium">
                      {RANKS_RULES[rank]}
                    </styled.p>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const RatingsPage = () => {
  const drivers = useLoaderData<LoaderData>();

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
      <Container pb={12} px={2} pt={2} maxW={800}>
        <Box textAlign="center" py={8} w="full">
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
          flexDirection="column"
          w="full"
        >
          <RankSection />

          <Box
            p={1}
            rounded="2xl"
            borderWidth={1}
            borderColor="gray.900"
            w="full"
            bgColor="black"
          >
            <Box
              borderWidth={1}
              borderColor="gray.900"
              p={4}
              rounded="xl"
              bgColor="gray.950"
            >
              <styled.table
                w="full"
                css={{ borderSpacing: "0 8px", borderCollapse: "separate" }}
              >
                <thead>
                  <tr>
                    <styled.th
                      textAlign="left"
                      pl={4}
                      w="50px"
                      color="gray.400"
                    >
                      #
                    </styled.th>
                    <styled.th />
                    <styled.th textAlign="right" color="gray.400">
                      Points
                    </styled.th>
                    <styled.th textAlign="right" color="gray.400" pr={4}>
                      Rank
                    </styled.th>
                  </tr>
                </thead>
                <tbody>
                  {drivers
                    .filter((driver) => driver.driverId !== 0)
                    .map((driver, i) => {
                      return (
                        <Row key={driver.id} driver={driver} rank={i + 1} />
                      );
                    })}
                </tbody>
              </styled.table>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default RatingsPage;
