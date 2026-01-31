import { TournamentsState } from "@prisma/client";
import { useLoaderData } from "react-router";
import { Card } from "~/components/CollapsibleCard";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getTournamentStandings } from "~/utils/getTournamentStandings";
import { prisma } from "~/utils/prisma.server";

export const loader = async () => {
  const tournaments = await prisma.tournaments.findMany({
    where: {
      state: TournamentsState.END,
      leaderboards: {
        some: {
          leaderboard: {
            userId: "user_2cXDyVukI5iNEnp2Aox2opAyML5",
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
    <>
      <Box
        bgImage="linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9)), url(https://ngo12if6yyhjvs7m.public.blob.vercel-storage.com/Group_Photo_8c37c991-c88d-43ba-9614-b8b874315868_1024x1024.webp)"
        bgSize="cover"
        bgPosition="center"
        pos="relative"
      >
        <Container maxW={1100} px={4} pt={{ base: 12, md: 20 }} pb={16}>
          <styled.h1 srOnly>
            SDC 2026 - Super Drift Competition - Standings
          </styled.h1>
          <Box maxW={500} mx="auto" mb={6}>
            <styled.img
              w="full"
              src="https://ngo12if6yyhjvs7m.public.blob.vercel-storage.com/sdc-logo-sm.png"
              alt="SDC 2026"
            />
          </Box>
        </Container>
      </Box>

      <Container maxW={740} px={4} py={12}>
        <Card p={4}>
          <styled.table w="full">
            <tbody>
              {standings.map((driver, i) => (
                <tr key={driver.driverId}>
                  <styled.td textAlign="center" fontFamily="mono">
                    {i + 1}
                  </styled.td>
                  <styled.td py={1} pl={2}>
                    <Flex pos="relative" alignItems="center" gap={2}>
                      <Box w={8} h={8} rounded="full" overflow="hidden">
                        <styled.img
                          rounded="full"
                          src={driver.image ?? "/blank-driver-right.jpg"}
                          w="full"
                          h="full"
                          objectFit="cover"
                        />
                      </Box>
                      {driver.firstName} {driver.lastName}
                    </Flex>
                  </styled.td>
                  <styled.td textAlign="right" fontFamily="mono">
                    {driver.points}
                  </styled.td>
                </tr>
              ))}
            </tbody>
          </styled.table>
        </Card>
      </Container>
    </>
  );
};

export default Page;
