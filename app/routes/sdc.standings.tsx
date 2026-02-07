import { TournamentsState } from "@prisma/client";
import { useLoaderData } from "react-router";
import { Card } from "~/components/CollapsibleCard";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getTournamentStandings } from "~/utils/getTournamentStandings";
import { prisma } from "~/utils/prisma.server";
import { SDC_USER_ID } from "~/utils/theme";

export const loader = async () => {
  const tournaments = await prisma.tournaments.findMany({
    where: {
      state: TournamentsState.END,
      leaderboards: {
        some: {
          leaderboard: {
            userId: SDC_USER_ID,
          },
        },
      },
    },
    orderBy: {
      id: "asc",
    },

    select: {
      id: true,
      format: true,
      enableQualifying: true,
      enableBattles: true,
      battles: {
        orderBy: [{ round: "asc" }, { bracket: "asc" }, { id: "asc" }],
        select: {
          id: true,
          winnerId: true,
          bracket: true,
          round: true,
          driverLeft: {
            select: {
              isBye: true,
              id: true,
              qualifyingPosition: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  image: true,
                  driverId: true,
                  team: true,
                },
              },
            },
          },
          driverRight: {
            select: {
              isBye: true,
              id: true,
              qualifyingPosition: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  image: true,
                  driverId: true,
                  team: true,
                },
              },
            },
          },
        },
      },
      drivers: {
        select: {
          id: true,
          qualifyingPosition: true,
          isBye: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              image: true,
              driverId: true,
              team: true,
            },
          },
        },
      },
    },
  });

  return getTournamentStandings(tournaments);
};

const Page = () => {
  const standings = useLoaderData<typeof loader>();

  return (
    <Container maxW={800} px={2} py={4}>
      <Flex flexDir="column" gap={2}>
        {standings.map((driver, i) => (
          <Card key={driver.driverId} pos="relative" overflow="hidden">
            <Flex p={4} alignItems="center" gap={4}>
              <styled.p fontWeight="extrabold" fontSize="xl" fontStyle="italic">
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
                  src={driver.image ?? "/blank-driver-right.jpg"}
                  w="full"
                  h="full"
                  objectFit="cover"
                />
              </Box>

              <Box flex={1} overflow="hidden">
                <LinkOverlay to={`/drivers/${driver.driverId}`}>
                  <styled.h2 lineHeight={1.1} fontWeight="medium">
                    {driver.firstName} {driver.lastName}
                  </styled.h2>
                </LinkOverlay>
                <styled.p
                  fontSize="sm"
                  color="gray.500"
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  overflow="hidden"
                >
                  {driver.team}
                </styled.p>
              </Box>

              <Box
                rounded="full"
                bgColor="gray.950"
                py={1}
                px={2}
                borderWidth={1}
                borderColor="gray.800"
              >
                <styled.p fontFamily="mono" fontSize="xs">
                  {driver.points} Points
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
