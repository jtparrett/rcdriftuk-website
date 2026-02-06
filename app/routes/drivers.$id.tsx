import type { LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useLocation } from "react-router";
import { z } from "zod";
import { Box, Container, styled, Flex, Spacer } from "~/styled-system/jsx";
import { getDriverRank, RANKS } from "~/utils/getDriverRank";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/drivers.$id";
import { adjustDriverElo } from "~/utils/adjustDriverElo.server";
import { calculateInactivityPenaltyOverPeriod } from "~/utils/inactivityPenalty.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { AppName } from "~/utils/enums";
import { TabsBar } from "~/components/TabsBar";
import { Tab } from "~/components/Tab";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const driverId = z.coerce.number().parse(params.id);

  const driver = await prisma.users.findFirst({
    where: {
      driverId,
    },
    select: {
      lastBattleDate: true,
      driverId: true,
      firstName: true,
      lastName: true,
      image: true,
      team: true,
      elo: true,
      totalBattles: true,
    },
  });

  notFoundInvariant(driver, "Driver not found");

  return {
    ...driver,
    elo: adjustDriverElo(driver.elo, driver.lastBattleDate),
    inactivityPenalty: calculateInactivityPenaltyOverPeriod(
      driver.lastBattleDate,
      new Date(),
    ),
  };
};

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data) return [];

  return [
    {
      title: `${AppName} | Driver Ratings | ${data.firstName} ${data.lastName}`,
    },
    {
      property: "og:image",
      content: "https://rcdrift.io/og-image.jpg",
    },
  ];
};

const Page = () => {
  const driver = useLoaderData<typeof loader>();
  const location = useLocation();

  const isBattlesTab = location.pathname.endsWith("battles");
  const isRatingsTab = location.pathname.endsWith("ratings");
  const isSetupTab = location.pathname.endsWith("setup");
  const isPostsTab = location.pathname.endsWith("posts");

  const rank = driver
    ? getDriverRank(driver.elo, driver.totalBattles)
    : RANKS.UNRANKED;

  const isInactive = driver.inactivityPenalty !== 0;

  return (
    <>
      <Box
        pos="relative"
        zIndex={1}
        overflow="hidden"
        borderBottomWidth={1}
        borderColor="gray.900"
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
        <Container maxW={800} px={4} py={6}>
          <Flex>
            <Spacer />
            <Flex
              p={1}
              rounded="full"
              bg="gray.950"
              borderWidth={1}
              borderColor="gray.800"
              shadow="lg"
              alignItems="center"
              gap={1}
            >
              <styled.span fontSize="md" fontWeight="medium" pl={2}>
                {driver.elo.toFixed(3)}
              </styled.span>
              <Box w={8} h={8} perspective="200px">
                <styled.img
                  src={`/badges/${rank}.png`}
                  w="full"
                  alt={rank}
                  animation="badge 4s linear infinite"
                />
              </Box>
            </Flex>
          </Flex>

          <Flex textAlign="center" alignItems="center" flexDir="column" pb={12}>
            <Box p={2} rounded="full" bg="rgba(255, 255, 255, 0.06)" mb={4}>
              <Box
                rounded="full"
                overflow="hidden"
                borderWidth={1}
                borderColor="gray.700"
                p={2}
                bg="gray.950"
              >
                <styled.img
                  display="block"
                  src={driver.image ?? "/blank-driver-right.jpg"}
                  alt={`${driver.firstName} ${driver.lastName}`}
                  w={32}
                  h={32}
                  rounded="full"
                  objectFit="cover"
                />
              </Box>
            </Box>

            <Flex gap={1} alignItems="center" mb={1}>
              <styled.span
                borderWidth={1}
                borderColor="gray.800"
                px={2}
                rounded="full"
                fontSize="sm"
                bgColor="black"
              >
                Driver #{driver.driverId}
              </styled.span>

              {(driver.inactivityPenalty !== 0 ||
                driver.lastBattleDate !== null) && (
                <styled.span
                  borderWidth={1}
                  borderColor={isInactive ? "red.800" : "green.800"}
                  px={2}
                  rounded="full"
                  fontSize="sm"
                  color={isInactive ? "red.400" : "green.400"}
                  bgColor="black"
                >
                  {isInactive
                    ? `Inactivity Penalty: ${driver.inactivityPenalty}`
                    : "Active"}
                </styled.span>
              )}
            </Flex>

            <styled.h1 fontSize="4xl" fontWeight="bold" lineHeight={1.1} mb={3}>
              {driver.firstName} {driver.lastName}
            </styled.h1>

            {driver.team && (
              <Flex
                gap={1}
                flexWrap="wrap"
                justifyContent="center"
                px={4}
                maxW={380}
              >
                {driver.team.split(",").map((team) => (
                  <styled.p
                    color="gray.400"
                    fontSize="sm"
                    fontWeight="medium"
                    px={2}
                    rounded="full"
                    borderWidth={1}
                    borderColor="gray.800"
                  >
                    {team}
                  </styled.p>
                ))}
              </Flex>
            )}
          </Flex>
        </Container>
      </Box>

      <TabsBar maxW={800}>
        <Tab to={`/drivers/${driver.driverId}/battles`} isActive={isBattlesTab}>
          Battles
        </Tab>
        <Tab to={`/drivers/${driver.driverId}/ratings`} isActive={isRatingsTab}>
          Ratings
        </Tab>
        <Tab to={`/drivers/${driver.driverId}/setup`} isActive={isSetupTab}>
          Setup
        </Tab>
        <Tab to={`/drivers/${driver.driverId}/posts`} isActive={isPostsTab}>
          Posts
        </Tab>
      </TabsBar>

      <Box bgColor="gray.950" borderTopWidth={1} borderColor="gray.900">
        <Container maxW={800} px={2} py={6}>
          <Outlet />
        </Container>
      </Box>
    </>
  );
};

export default Page;
