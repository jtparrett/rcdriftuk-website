import { z } from "zod";
import { prisma } from "~/utils/prisma.server";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { Box, Flex } from "~/styled-system/jsx";
import { Driver } from "./tournaments.$id.battles.$bracket";
import { TournamentsDriverNumbers } from "~/utils/enums";
import { Glow } from "~/components/Glow";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirstOrThrow({
    where: { id },
    include: {
      nextBattle: true,
    },
  });

  const battles = await prisma.tournamentBattles.findMany({
    where: {
      tournamentId: id,
      round: tournament.nextBattle?.round,
      bracket: tournament.nextBattle?.bracket,
    },
    orderBy: [{ id: "asc" }],
    include: {
      driverLeft: {
        include: {
          user: true,
        },
      },
      driverRight: {
        include: {
          user: true,
        },
      },
    },
  });

  return { tournament, battles };
};

type Battle = Awaited<ReturnType<typeof loader>>["battles"][number];

const TournamentsBattlesListPage = () => {
  const { tournament, battles } = useLoaderData<typeof loader>();

  const getDriverNumber = (
    driver: Battle["driverLeft"] | Battle["driverRight"],
  ) => {
    if (tournament.driverNumbers === TournamentsDriverNumbers.NONE) {
      return undefined;
    }
    if (tournament.driverNumbers === TournamentsDriverNumbers.UNIVERSAL) {
      return driver?.user.driverId;
    }
    return driver?.tournamentDriverNumber;
  };

  return (
    <Box overflow="hidden" className="main">
      <Flex flexWrap="wrap" mr={-2}>
        {battles.map((battle) => {
          const isNextBattle = battle.id === tournament.nextBattle?.id;
          return (
            <Box
              key={battle.id}
              mr={2}
              mb={2}
              w="calc(16.66666% - var(--spacing-2))"
            >
              <Box
                h={12}
                rounded="lg"
                borderWidth={1}
                borderColor={isNextBattle ? "brand.500" : "gray.700"}
                position="relative"
                overflow="hidden"
                bgColor="gray.950"
                shadow="0 4px 12px black"
                zIndex={0}
              >
                <Box
                  pos="absolute"
                  top="50%"
                  borderBottomWidth={1}
                  borderColor="gray.700"
                  w="full"
                  borderStyle="dashed"
                  zIndex={1}
                />
                {isNextBattle && <Glow size="sm" />}
                <Driver
                  driver={battle.driverLeft}
                  winnerId={battle.winnerId}
                  driverNo={getDriverNumber(battle.driverLeft)}
                />
                <Driver
                  driver={battle.driverRight}
                  winnerId={battle.winnerId}
                  driverNo={getDriverNumber(battle.driverRight)}
                />
              </Box>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
};

export default TournamentsBattlesListPage;
