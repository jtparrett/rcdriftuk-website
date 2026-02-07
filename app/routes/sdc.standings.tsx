import { TournamentsState } from "@prisma/client";
import { useLoaderData } from "react-router";
import { Card } from "~/components/CollapsibleCard";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { SDC_USER_ID } from "~/utils/theme";

export const loader = async () => {
  const drivers = await prisma.tournamentDrivers.findMany({
    where: {
      tournament: {
        state: TournamentsState.END,
        leaderboards: {
          some: {
            leaderboard: {
              userId: SDC_USER_ID,
            },
          },
        },
      },
    },
    include: {
      user: true,
    },
    orderBy: [
      {
        finishingPosition: "asc",
      },
      {
        qualifyingPosition: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  return drivers;
};

const Page = () => {
  const drivers = useLoaderData<typeof loader>();

  return (
    <Container maxW={800} px={2} py={4}>
      <Flex flexDir="column" gap={2}>
        {drivers.map((driver, i) => (
          <Card
            key={driver.driverId}
            pos="relative"
            bgGradient="to-b"
            gradientFrom="gray.900"
            gradientTo="black"
          >
            <Flex p={6} alignItems="center" gap={4}>
              <styled.p
                fontWeight="extrabold"
                fontSize="2xl"
                fontStyle="italic"
              >
                {i + 1}
              </styled.p>

              <Box
                w={10}
                h={10}
                rounded="full"
                overflow="hidden"
                borderWidth={1}
                borderColor="gray.400"
              >
                <styled.img
                  rounded="full"
                  src={driver.user.image ?? "/blank-driver-right.jpg"}
                  w="full"
                  h="full"
                  objectFit="cover"
                />
              </Box>

              <Box flex={1} overflow="hidden">
                <LinkOverlay to={`/drivers/${driver.driverId}`}>
                  <styled.h2 lineHeight={1.1} fontWeight="medium">
                    {driver.user.firstName} {driver.user.lastName}
                  </styled.h2>
                </LinkOverlay>
                <styled.p
                  fontSize="sm"
                  color="gray.500"
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  overflow="hidden"
                >
                  {driver.user.team}
                </styled.p>
              </Box>
            </Flex>
          </Card>
        ))}
      </Flex>
    </Container>
  );
};

export default Page;
