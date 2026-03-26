import { z } from "zod";
import { format } from "date-fns";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { RiArrowRightSLine } from "react-icons/ri";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { Card } from "~/components/CollapsibleCard";
import { LinkOverlay } from "~/components/LinkOverlay";
import { prisma } from "~/utils/prisma.server";
import notFoundInvariant from "~/utils/notFoundInvariant";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);

  const leaderboard = await prisma.leaderboards.findUnique({
    where: { id },
    include: {
      tournaments: {
        orderBy: { id: "asc" },
        include: {
          tournament: true,
        },
      },
    },
  });

  notFoundInvariant(leaderboard, "Leaderboard not found");

  return {
    tournaments: leaderboard.tournaments.map((lt) => lt.tournament),
  };
};

const TournamentsPage = () => {
  const { tournaments } = useLoaderData<typeof loader>();

  if (tournaments.length === 0) {
    return (
      <styled.p textAlign="center" color="gray.500">
        No tournaments added yet
      </styled.p>
    );
  }

  return (
    <Flex flexDir="column" gap={2}>
      {tournaments.map((tournament) => (
        <Card
          key={tournament.id}
          pos="relative"
          bgGradient="to-b"
          gradientFrom="gray.900"
          gradientTo="black"
        >
          <Flex alignItems="center" gap={1} p={6}>
            <Box flex={1}>
              <LinkOverlay to={`/tournaments/${tournament.id}`}>
                <styled.h2 fontWeight="medium">{tournament.name}</styled.h2>
              </LinkOverlay>
              <styled.p fontSize="sm" color="gray.500">
                {format(new Date(tournament.createdAt), "MMM d, yyyy")}
              </styled.p>
            </Box>
            <RiArrowRightSLine />
          </Flex>
        </Card>
      ))}
    </Flex>
  );
};

export default TournamentsPage;
