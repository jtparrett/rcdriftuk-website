import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { BattlesBracket, TournamentsState } from "~/utils/enums";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { useReloader } from "~/utils/useReloader";
import { getBracketName } from "~/utils/getBracketName";
import { sentenceCase } from "change-case";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      nextBattle: {
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
      },
      nextQualifyingLap: {
        include: {
          driver: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

  const totalBattlesForRound = await prisma.tournamentBattles.count({
    where: {
      tournamentId: tournament.id,
      round: tournament.nextBattle?.round,
    },
  });

  const bracket = getBracketName(
    tournament.nextBattle?.round ?? 0,
    tournament.nextBattle?.bracket ?? BattlesBracket.UPPER,
    totalBattlesForRound,
  );

  return { tournament, bracket };
};

const TournamentsSummaryPage = () => {
  const { tournament, bracket } = useLoaderData<typeof loader>();

  useReloader();

  if (tournament.state === TournamentsState.QUALIFYING) {
    return (
      <Box>
        <styled.p>
          Now: {tournament.nextQualifyingLap?.driver.user?.firstName}{" "}
          {tournament.nextQualifyingLap?.driver.user?.lastName} qualifying run{" "}
          {tournament.nextQualifyingLap?.round}
        </styled.p>
      </Box>
    );
  }

  if (tournament.state === TournamentsState.BATTLES) {
    return (
      <Flex
        pos="relative"
        h="100dvh"
        w="100dvw"
        justifyContent="flex-end"
        alignItems="flex-start"
        overflow="hidden"
      >
        <Flex pt={4} pr={4} mr={-12}>
          <Box
            bgGradient="to-b"
            gradientFrom="brand.500"
            gradientTo="brand.700"
            transform="skewX(16deg)"
            px={4}
            py={3}
            flex="none"
            borderTopLeftRadius="lg"
            borderBottomLeftRadius="lg"
            borderTopRightRadius="lg"
            mr={-2}
            pos="relative"
            zIndex={2}
          >
            <styled.p
              fontSize="lg"
              fontWeight="semibold"
              transform="skewX(-16deg)"
            >
              NOW
            </styled.p>
          </Box>
          <Box
            transform="skewX(16deg)"
            bgGradient="to-b"
            gradientFrom="gray.800"
            gradientTo="gray.900"
            flex="none"
            w="fit-content"
            pl={6}
            pr={14}
            py={3}
            borderRightRadius="lg"
          >
            <styled.p
              fontSize="lg"
              fontWeight="semibold"
              transform="skewX(-16deg)"
            >
              {tournament.nextBattle?.driverLeft?.user?.firstName}{" "}
              {tournament.nextBattle?.driverLeft?.user?.lastName} vs{" "}
              {tournament.nextBattle?.driverRight?.user?.firstName}{" "}
              {tournament.nextBattle?.driverRight?.user?.lastName} in{" "}
              {tournament.nextBattle?.bracket?.toLowerCase()} {bracket}
            </styled.p>
          </Box>
        </Flex>
      </Flex>
    );
  }

  return null;
};

export default TournamentsSummaryPage;
