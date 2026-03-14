import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Outlet, useFetcher, useLoaderData, useLocation } from "react-router";
import { z } from "zod";
import { Box, Container, styled, Flex, Spacer } from "~/styled-system/jsx";
import { getDriverRank, RANKS } from "~/utils/getDriverRank";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/drivers.$id";
import { adjustDriverElo } from "~/utils/adjustDriverElo.server";
import { calculateInactivityPenaltyOverPeriod } from "~/utils/inactivityPenalty.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { AppName } from "~/utils/enums";
import { getBestRegionalElo } from "~/utils/getBestRegionalElo";
import { TabsBar } from "~/components/TabsBar";
import { Tab } from "~/components/Tab";
import { Button } from "~/components/Button";
import { SignedIn } from "@clerk/react-router";
import { getAuth } from "~/utils/getAuth.server";
import invariant from "~/utils/invariant";
import {
  RiDashboard2Line,
  RiListOrdered2,
  RiMessageLine,
  RiSwordLine,
  RiVipCrown2Line,
} from "react-icons/ri";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const driverId = z.coerce.number().parse(params.id);
  const { userId } = await getAuth(args);

  const driver = await prisma.users.findFirst({
    where: {
      driverId,
    },
    select: {
      lastBattleDate: true,
      driverId: true,
      id: true,
      firstName: true,
      lastName: true,
      image: true,
      team: true,
      elo_UK: true,
      elo_EU: true,
      elo_NA: true,
      elo_ZA: true,
      elo_LA: true,
      elo_AP: true,
      ranked: true,
    },
  });

  notFoundInvariant(driver, "Driver not found");

  const isUnclaimed = driver.id === null;

  let hasPendingClaim = false;
  let isCurrentUserRequester = false;
  if (isUnclaimed) {
    const existingClaim = await prisma.profileClaimRequests.findUnique({
      where: { driverId },
      select: { userId: true },
    });
    hasPendingClaim = !!existingClaim;
    isCurrentUserRequester = !!userId && existingClaim?.userId === userId;
  }

  const adjusted = {
    elo_UK: adjustDriverElo(driver.elo_UK, driver.lastBattleDate),
    elo_EU: adjustDriverElo(driver.elo_EU, driver.lastBattleDate),
    elo_NA: adjustDriverElo(driver.elo_NA, driver.lastBattleDate),
    elo_ZA: adjustDriverElo(driver.elo_ZA, driver.lastBattleDate),
    elo_LA: adjustDriverElo(driver.elo_LA, driver.lastBattleDate),
    elo_AP: adjustDriverElo(driver.elo_AP, driver.lastBattleDate),
  };
  const { bestElo, bestRegion } = getBestRegionalElo(adjusted);

  return {
    ...driver,
    ...adjusted,
    bestElo,
    bestRegion,
    isUnclaimed,
    hasPendingClaim,
    isCurrentUserRequester,
    isSignedIn: !!userId,
    inactivityPenalty: calculateInactivityPenaltyOverPeriod(
      driver.lastBattleDate,
      new Date(),
    ),
  };
};

export const action = async (args: ActionFunctionArgs) => {
  const { params } = args;
  const driverId = z.coerce.number().parse(params.id);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "You must be signed in to claim a profile");

  const driver = await prisma.users.findFirst({
    where: { driverId },
    select: { id: true },
  });

  notFoundInvariant(driver, "Driver not found");
  notFoundInvariant(driver.id === null, "This profile is already claimed");

  const existingClaim = await prisma.profileClaimRequests.findUnique({
    where: { driverId },
  });

  notFoundInvariant(
    !existingClaim,
    "A claim request already exists for this profile",
  );

  await prisma.profileClaimRequests.create({
    data: {
      driverId,
      userId,
    },
  });

  return { success: true };
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
  const isTournamentsTab = location.pathname.endsWith("tournaments");
  const isRatingsTab = location.pathname.endsWith("ratings");
  const isSetupTab = location.pathname.endsWith("setup");
  const isPostsTab = location.pathname.endsWith("posts");

  const rank = driver
    ? getDriverRank(driver.bestElo, driver.ranked)
    : RANKS.UNRANKED;

  const isInactive = driver.inactivityPenalty !== 0;

  return (
    <>
      {driver.isUnclaimed && <ClaimProfileBanner driver={driver} />}

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
              py={1}
              pl={4}
              pr={2}
              rounded="full"
              bg="gray.950"
              borderWidth={1}
              borderColor="gray.800"
              shadow="lg"
              alignItems="center"
              gap={1}
            >
              <styled.p fontSize="md" fontWeight="medium" fontFamily="mono">
                {driver.bestElo.toFixed(3)}
                <styled.span color="gray.400" ml={1}>
                  {driver.bestRegion}
                </styled.span>
              </styled.p>
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

            <styled.h1
              fontSize="4xl"
              fontWeight="bold"
              lineHeight={1.1}
              mb={3}
              whiteSpace="balance"
            >
              {driver.firstName} {driver.lastName}{" "}
              <styled.span color="gray.500">#{driver.driverId}</styled.span>
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
        <Tab
          to={`/drivers/${driver.driverId}/battles`}
          isActive={isBattlesTab}
          data-replace="true"
          replace
        >
          <RiSwordLine />
          Battles
        </Tab>
        <Tab
          to={`/drivers/${driver.driverId}/tournaments`}
          isActive={isTournamentsTab}
          data-replace="true"
          replace
        >
          <RiVipCrown2Line />
          Tournaments
        </Tab>
        <Tab
          to={`/drivers/${driver.driverId}/ratings`}
          isActive={isRatingsTab}
          data-replace="true"
          replace
        >
          <RiListOrdered2 />
          Ratings
        </Tab>
        <Tab
          to={`/drivers/${driver.driverId}/setup`}
          isActive={isSetupTab}
          data-replace="true"
          replace
        >
          <RiDashboard2Line />
          Setup
        </Tab>
        <Tab
          to={`/drivers/${driver.driverId}/posts`}
          isActive={isPostsTab}
          data-replace="true"
          replace
        >
          <RiMessageLine />
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

const ClaimProfileBanner = ({
  driver,
}: {
  driver: ReturnType<typeof useLoaderData<typeof loader>>;
}) => {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== "idle";

  if (driver.hasPendingClaim) {
    return (
      <Box bg="gray.900" py={2} px={4} textAlign="center">
        <styled.p fontSize="sm" color="gray.400">
          {driver.isCurrentUserRequester
            ? "Your claim request is pending approval."
            : "Someone has already requested to claim this profile."}
        </styled.p>
      </Box>
    );
  }

  return (
    <SignedIn>
      <Box bg="brand.600" py={2}>
        <Container maxW={800} px={4}>
          <Flex alignItems="center" justifyContent="space-between" gap={3}>
            <styled.p fontSize="sm" fontWeight="medium" color="white">
              Is this you? Claim this profile.
            </styled.p>
            <fetcher.Form method="post">
              <Button
                type="submit"
                variant="secondary"
                size="xs"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                flexShrink={0}
              >
                {isSubmitting ? "Requesting..." : "Claim Profile"}
              </Button>
            </fetcher.Form>
          </Flex>
        </Container>
      </Box>
    </SignedIn>
  );
};

export default Page;
