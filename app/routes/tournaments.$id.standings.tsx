import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { LinkOverlay } from "~/components/LinkOverlay";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { TournamentsFormat, TournamentsState } from "~/utils/enums";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const battles = await prisma.tournamentBattles.findMany({
    where: {
      tournamentId: id,
      tournament: {
        OR: [
          {
            state: TournamentsState.END,
          },
          {
            format: TournamentsFormat.DRIFT_WARS,
          },
        ],
      },
    },
    select: {
      id: true,
      winnerId: true,
      tournament: {
        select: {
          format: true,
        },
      },
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
  });

  // Create a map to track unique drivers and their battle counts
  const driverMap = new Map();

  // Loop through battles to count appearances and store qualifying positions
  battles.forEach((battle) => {
    const leftDriver = battle.driverLeft;
    const rightDriver = battle.driverRight;

    if (leftDriver && !leftDriver.isBye) {
      // Process left driver
      if (!driverMap.has(leftDriver.id)) {
        driverMap.set(leftDriver.id, {
          id: leftDriver.id,
          driverId: leftDriver.user.driverId,
          firstName: leftDriver.user.firstName,
          lastName: leftDriver.user.lastName,
          battleCount: 1,
          winCount: battle.winnerId === leftDriver.id ? 1 : 0,
          qualifyingPosition: leftDriver.qualifyingPosition,
          image: leftDriver.user.image,
        });
      } else {
        const driver = driverMap.get(leftDriver.id);
        driver.battleCount++;
        if (battle.winnerId === leftDriver.id) {
          driver.winCount++;
        }
      }
    }

    if (rightDriver && !rightDriver.isBye) {
      // Process right driver
      if (!driverMap.has(rightDriver.id)) {
        driverMap.set(rightDriver.id, {
          id: rightDriver.id,
          driverId: rightDriver.user.driverId,
          firstName: rightDriver.user.firstName,
          lastName: rightDriver.user.lastName,
          battleCount: 1,
          winCount: battle.winnerId === rightDriver.id ? 1 : 0,
          qualifyingPosition: rightDriver.qualifyingPosition,
          image: rightDriver.user.image,
        });
      } else {
        const driver = driverMap.get(rightDriver.id);
        driver.battleCount++;
        if (battle.winnerId === rightDriver.id) {
          driver.winCount++;
        }
      }
    }
  });

  // Convert map to array and sort by battle count, win count, and qualifying position
  const sortedDrivers = Array.from(driverMap.values()).sort((a, b) => {
    if (a.tournament.format === TournamentsFormat.DRIFT_WARS) {
      if (b.winCount !== a.winCount) {
        return b.winCount - a.winCount;
      }

      return a.qualifyingPosition - b.qualifyingPosition;
    }

    // First sort by battle count (descending)
    if (b.battleCount !== a.battleCount) {
      return b.battleCount - a.battleCount;
    }
    // Then sort by win count (descending)
    if (b.winCount !== a.winCount) {
      return b.winCount - a.winCount;
    }
    // Finally sort by qualifying position (ascending)
    return a.qualifyingPosition - b.qualifyingPosition;
  });

  return sortedDrivers;
};

const TournamentStandingsPage = () => {
  const drivers = useLoaderData<typeof loader>();

  return (
    <styled.div
      bgColor="gray.900"
      rounded="xl"
      p={4}
      borderWidth={1}
      borderColor="gray.800"
      maxW="600px"
    >
      <styled.table w="full">
        <styled.tbody>
          {drivers.map((driver, index) => (
            <styled.tr key={driver.id}>
              <styled.td textAlign="center" fontFamily="mono" w={8}>
                {index + 1}
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
                  <LinkOverlay to={`/ratings/${driver.driverId}`} />
                  {driver.firstName} {driver.lastName}
                </Flex>
              </styled.td>
            </styled.tr>
          ))}
        </styled.tbody>
      </styled.table>
    </styled.div>
  );
};

export default TournamentStandingsPage;
