import {
  redirect,
  useLoaderData,
  useSearchParams,
  type LoaderFunctionArgs,
} from "react-router";
import { styled, Container, Box, Flex, Center } from "~/styled-system/jsx";
import {
  getDriverRank,
  getRankColor,
  RANKS,
  RANKS_RULES,
} from "~/utils/getDriverRank";
import { getDriverRatings } from "~/utils/getDriverRatings.server";
import { RiArrowDownSLine, RiSearchLine } from "react-icons/ri";
import { useDisclosure } from "~/utils/useDisclosure";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Regions } from "~/utils/enums";
import type { Route } from "./+types/ratings.$region";
import { Tab } from "~/components/Tab";
import { z } from "zod";
import { TabsBar } from "~/components/TabsBar";
import { useCallback, useState } from "react";
import { AppName } from "~/utils/enums";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `${AppName} | Driver Ratings`,
      description:
        "Global RC Drift Driver Ratings, see where you rank amoungst some of the best drivers in the world.",
      "og:title": `${AppName} | Driver Ratings`,
      "og:description":
        "Global RC Drift Driver Ratings, see where you rank amoungst some of the best drivers in the world.",
    },
    {
      property: "og:image",
      content: "https://rcdrift.io/og-image.jpg",
    },
  ];
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const region = z.nativeEnum(Regions).safeParse(params.region?.toUpperCase());
  const url = new URL(request.url);
  const query = url.searchParams.get("query");

  if (!region.success) {
    throw redirect("/ratings/all");
  }

  const drivers = await getDriverRatings(region.data);

  // Improved search: match first name, last name, full name, and driverId (as string)
  const filteredDrivers = drivers.filter((driver) => {
    if (!query) return true;

    const q = query.trim().toLowerCase();
    const first = driver.firstName?.toLowerCase() ?? "";
    const last = driver.lastName?.toLowerCase() ?? "";
    const full = `${first} ${last}`.trim();
    const driverIdStr = String(driver.driverId ?? "");

    return (
      first.includes(q) ||
      last.includes(q) ||
      full.includes(q) ||
      driverIdStr.includes(q)
    );
  });

  return {
    drivers: filteredDrivers,
    region: region.data,
  };
};

type LoaderData = typeof loader;

const Row = ({
  driver,
  region,
}: {
  driver: Awaited<ReturnType<LoaderData>>["drivers"][number];
  region: Regions;
}) => {
  const rankTitle = driver
    ? getDriverRank(driver.elo, driver.totalBattles)
    : RANKS.UNRANKED;

  const elo = region === Regions.ALL ? driver.elo : driver[`elo_${region}`];
  const [bg, hover] = getRankColor(rankTitle);

  return (
    <Box
      style={
        {
          "--row-bg": bg,
          "--row-hover": hover,
        } as React.CSSProperties
      }
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
          <Box w={7} flex="none" textAlign="center">
            <styled.span fontFamily="mono">{driver.rank}</styled.span>
          </Box>
          <Box
            w={12}
            h={12}
            rounded="full"
            overflow="hidden"
            bgColor="rgba(255, 255, 255, 0.2)"
            p={1}
            shadow="inset 0 -1px 0 rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(0, 0, 0, 0.5)"
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
              letterSpacing="tight"
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
            fontSize="xs"
            display="block"
            rounded="full"
            px={2.5}
            py={1}
            bgColor="rgba(255, 255, 255, 0.1)"
            shadow="inset 0 -1px 0 rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(0, 0, 0, 0.5)"
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
      borderWidth={1}
      borderColor="gray.800"
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
                  style={
                    {
                      "--rank-bg": bg,
                    } as React.CSSProperties
                  }
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
  );
};

const RatingsPage = () => {
  const { drivers, region } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") ?? "";
  const [searchValue, setSearchValue] = useState(query);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const newSearchParams = new URLSearchParams(searchParams);
          if (value.trim()) {
            newSearchParams.set("query", value.trim());
          } else {
            newSearchParams.delete("query");
          }
          setSearchParams(newSearchParams);
        }, 300); // 300ms debounce
      };
    })(),
    [searchParams, setSearchParams],
  );

  // Handle input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  return (
    <>
      <styled.h1 srOnly>Driver Ratings</styled.h1>
      <TabsBar>
        {Object.values(Regions).map((option) => {
          return (
            <Tab
              key={option}
              to={`/ratings/${option.toLowerCase()}${
                query ? `?query=${query}` : ""
              }`}
              isActive={option === region}
              replace
            >
              {option}
            </Tab>
          );
        })}
      </TabsBar>

      <Box borderBottomWidth={1} borderColor="gray.900">
        <Flex maxW={1100} mx="auto">
          <Center pl={4} color="gray.500">
            <RiSearchLine />
          </Center>
          <styled.input
            value={searchValue}
            onChange={handleSearchChange}
            bgColor="inherit"
            px={2}
            py={3}
            w="full"
            placeholder={`Search ${region === Regions.ALL ? "" : `${region} `}driver ratings...`}
            color="inherit"
            outline="none"
          />
        </Flex>
      </Box>

      <Container pb={12} px={2} pt={2} maxW={800}>
        <Flex
          gap={4}
          alignItems={{ md: "flex-start" }}
          flexDirection="column"
          w="full"
        >
          <Flex flexDirection="column" gap={2} w="full">
            <RankSection />

            {drivers.map((driver) => {
              return (
                <Row key={driver.driverId} driver={driver} region={region} />
              );
            })}

            {drivers.length === 0 && (
              <styled.p textAlign="center" color="gray.500" py={4}>
                No drivers found.
              </styled.p>
            )}
          </Flex>
        </Flex>
      </Container>
    </>
  );
};

export default RatingsPage;
