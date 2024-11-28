import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { styled, Container, Box, Flex } from "~/styled-system/jsx";
import { getDriverRank, RANKS, RANKS_RULES } from "~/utils/getDriverRank";
import { getDriverRatings } from "~/utils/getDriverRatings";
import { RiArrowDownSLine } from "react-icons/ri";
import { useDisclosure } from "~/utils/useDisclosure";
import { LinkOverlay } from "~/components/LinkOverlay";
import type { Values } from "~/utils/values";

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

  const [bg, hover] = getRankColor(rankTitle);

  return (
    <styled.tr
      transition="all 0.2s"
      bg="var(--row-bg)"
      _hover={{
        backgroundColor: "var(--row-hover)",
        transform: "scale(1.01)",
      }}
      role="link"
      borderWidth="1px"
      borderColor="gray.800"
      _active={{
        transform: "scale(0.99)",
      }}
      shadow="lg"
      style={{
        // @ts-ignore
        "--row-bg": bg,
        "--row-hover": hover,
      }}
    >
      <styled.td fontFamily="mono" pl={4} py={4} borderLeftRadius="xl">
        {rank}
      </styled.td>
      <styled.td py={4} pos="relative" w="full" px={2}>
        <LinkOverlay to={`/ratings/${driver.driverId}`} />
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
      </styled.td>
      <styled.td
        textAlign="right"
        py={4}
        fontFamily="mono"
        pos="relative"
        px={2}
      >
        <LinkOverlay to={`/ratings/${driver.driverId}`} />
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

const getRankColor = (rank: Values<typeof RANKS>): [string, string] => {
  switch (rank) {
    case RANKS.UNRANKED:
      return ["#12161D", "#0B0E13"];
    case RANKS.BRONZE:
      return ["#3E2A0B", "#2C1D07"];
    case RANKS.SILVER:
      return ["#262B32", "#1B1F24"];
    case RANKS.GOLD:
      return ["#48350F", "#32250B"];
    case RANKS.DIAMOND:
      return ["#102B45", "#0C1F31"];
    case RANKS.PLATINUM:
      return ["#353A40", "#26292D"];
    default:
      return ["#070809", "#050506"];
  }
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
        overflow="hidden"
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
                const [bg] = getRankColor(rank);

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
                    bgColor="var(--rank-bg)"
                    style={{
                      // @ts-ignore
                      "--rank-bg": bg,
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
                    <styled.th textAlign="right" color="gray.400" px={2}>
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
