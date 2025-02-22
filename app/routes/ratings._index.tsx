import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { styled, Container, Box, Flex, Spacer } from "~/styled-system/jsx";
import {
  getDriverRank,
  getRankColor,
  RANKS,
  RANKS_RULES,
} from "~/utils/getDriverRank";
import { getDriverRatings } from "~/utils/getDriverRatings";
import { RiArrowDownSLine } from "react-icons/ri";
import { useDisclosure } from "~/utils/useDisclosure";
import { LinkOverlay } from "~/components/LinkOverlay";

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
    <Box
      style={{
        // @ts-ignore
        "--row-bg": bg,
        "--row-hover": hover,
      }}
      bg="var(--row-bg)"
      p={1}
      rounded="2xl"
      transition="all 0.2s"
      _hover={{
        md: {
          transform: "scale(1.01)",
        },
      }}
    >
      <Box
        rounded="xl"
        py={4}
        px={{ base: 2, md: 4 }}
        transition="all 0.2s"
        bg="var(--row-bg)"
        _hover={{
          md: {
            backgroundColor: "var(--row-hover)",
            "&::after": {
              transform: "translateX(80px) skewX(-40deg) scaleX(1.1)",
              opacity: 1,
            },
          },
        }}
        borderWidth="1px"
        borderColor="rgba(0, 0, 0, 0.3)"
        _active={{
          md: {
            transform: "scale(0.99)",
          },
        }}
        shadow="inset 0 1px 0 rgba(255, 255, 255, 0.2)"
        pos="relative"
        overflow="hidden"
        _after={{
          filter: "blur(3px)",
          opacity: 0,
          transition: "all 0.2s",
          content: '""',
          pos: "absolute",
          top: 0,
          left: "50%",
          w: 3,
          bg: "rgba(255, 255, 255, 0.2)",
          h: "full",
          transform: "skewX(-25deg) translateX(-300px)",
          boxShadow:
            "14px 0 0 rgba(255, 255, 255, 0.1), 28px 0 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        <LinkOverlay to={`/ratings/${driver.driverId}`} />
        <Flex gap={2} alignItems="center">
          <styled.span fontFamily="mono" flex="none" w={7} textAlign="center">
            {rank}
          </styled.span>
          <Box
            w={12}
            h={12}
            rounded="full"
            overflow="hidden"
            bgColor="rgba(255, 255, 255, 0.1)"
            p={1}
          >
            <styled.img
              rounded="full"
              src={driver.image ?? "/blank-driver-right.jpg"}
              w="full"
              h="full"
              objectFit="cover"
            />
          </Box>
          <Box flex={1} overflow="hidden">
            <styled.p
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
              fontWeight="semibold"
              w="full"
              fontSize={{ base: "sm", md: "md" }}
            >
              {driver.firstName} {driver.lastName}
            </styled.p>
            <styled.p
              fontSize="xs"
              color="rgba(255, 255, 255, 0.5)"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
              w="full"
            >
              {driver.team}
            </styled.p>
          </Box>
          <styled.span
            flex="none"
            textAlign="right"
            fontFamily="mono"
            fontSize={{ base: "sm", md: "md" }}
          >
            {driver.currentElo.toFixed(3)}
          </styled.span>
          <styled.span flex="none" textAlign="right">
            <styled.img
              src={`/badges/${rankTitle}.png`}
              w={8}
              display="inline-block"
              alt={rankTitle}
            />
          </styled.span>
        </Flex>
      </Box>
    </Box>
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
        overflow="hidden"
      >
        <Flex
          p={4}
          alignItems="center"
          justifyContent="space-between"
          cursor="pointer"
          onClick={keyDisclosure.toggle}
          _hover={{
            md: {
              bgColor: "gray.800",
            },
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
              w="full"
              overflow="hidden"
            >
              <Flex
                gap={4}
                color="gray.400"
                fontWeight="bold"
                px={{ base: 2, md: 4 }}
                pb={2}
              >
                <styled.p>#</styled.p>
                <Spacer />
                <styled.p>Points</styled.p>
                <styled.p>Rank</styled.p>
              </Flex>

              <Flex flexDirection="column" gap={2}>
                {drivers
                  .filter((driver) => driver.driverId !== 0)
                  .map((driver, i) => {
                    return <Row key={driver.id} driver={driver} rank={i + 1} />;
                  })}
              </Flex>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default RatingsPage;
