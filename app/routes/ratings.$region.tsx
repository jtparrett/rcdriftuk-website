import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { styled, Container, Box, Flex } from "~/styled-system/jsx";
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
import { Regions } from "~/utils/enums";
import type { Route } from "./+types/ratings.$region";
import { Tab } from "~/components/Tab";
import { z } from "zod";

export const meta: Route.MetaFunction = () => {
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

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const region = z.nativeEnum(Regions).safeParse(params.region?.toUpperCase());

  if (!region.success) {
    throw redirect("/ratings/all");
  }

  const drivers = await getDriverRatings(region.data);

  return { drivers, region: region.data };
};

type LoaderData = typeof loader;

const Row = ({
  driver,
  rank,
  region,
}: {
  driver: Awaited<ReturnType<LoaderData>>["drivers"][number];
  rank: number;
  region: Regions;
}) => {
  const rankTitle = driver
    ? getDriverRank(driver.elo, driver.totalBattles)
    : RANKS.UNRANKED;

  const elo = region === Regions.ALL ? driver.elo : driver[`elo_${region}`];
  const [bg, hover] = getRankColor(rankTitle);

  return (
    <Box
      style={{
        // @ts-ignore
        "--row-bg": bg,
        "--row-hover": hover,
      }}
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
        _active={{
          md: {
            transform: "scale(0.99)",
          },
        }}
        shadow="inset 0 1px 0 rgba(255, 255, 255, 0.2)"
        pos="relative"
        overflow="hidden"
        zIndex={1}
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
        _before={{
          content: '""',
          pos: "absolute",
          inset: 0,
          bgGradient: "to-b",
          gradientFrom: "transparent",
          gradientTo: "rgba(0, 0, 0, 0.4)",
          zIndex: -1,
        }}
      >
        <LinkOverlay to={`/drivers/${driver.driverId}`} />
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
            {driver.team && (
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
            )}
          </Box>
          <styled.span
            flex="none"
            textAlign="right"
            fontFamily="mono"
            fontSize={{ base: "sm", md: "md" }}
          >
            {elo.toFixed(3)}
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
              {Object.values(RANKS).map((rank, i) => {
                const [bg] = getRankColor(rank);

                return (
                  <Flex
                    key={i}
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
  const { drivers, region } = useLoaderData<LoaderData>();

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
        bgImage: "url(/dot-bg.svg)",
        bgSize: "16px",
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
      <Container pb={12} px={4} pt={2} maxW={800}>
        <Box textAlign="center" py={8} w="full">
          <styled.h1
            fontSize={{ base: "4xl", md: "5xl" }}
            fontWeight="extrabold"
          >
            Driver Ratings
          </styled.h1>

          <styled.p
            mb={4}
            color="gray.500"
            textWrap="balance"
            maxW={300}
            mx="auto"
          >
            Discover the top rated drivers from across the world.
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
              rounded="xl"
              bgColor="gray.950"
              w="full"
              overflow="hidden"
            >
              <Box overflow="auto">
                <Flex gap={2} alignItems="center" p={4}>
                  {Object.values(Regions).map((option) => {
                    return (
                      <Tab
                        key={option}
                        to={`/ratings/${option.toLowerCase()}`}
                        isActive={option === region}
                      >
                        {option}
                      </Tab>
                    );
                  })}
                </Flex>
              </Box>

              <Flex flexDirection="column" gap={2} px={4} pb={4}>
                {drivers
                  .filter((driver) => driver.driverId !== 0)
                  .map((driver, i) => {
                    return (
                      <Row
                        key={i}
                        driver={driver}
                        rank={i + 1}
                        region={region}
                      />
                    );
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
