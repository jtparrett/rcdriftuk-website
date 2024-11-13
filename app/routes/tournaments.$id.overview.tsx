import { TournamentsState } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { capitalCase } from "change-case";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Box, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      nextQualifyingLap: {
        include: {
          driver: true,
        },
      },
    },
  });

  return tournament;
};

const TournamentsOverviewPage = () => {
  const tournament = useLoaderData<typeof loader>();

  invariant(tournament);

  return (
    <Box p={1} borderWidth={1} rounded="2xl" borderColor="gray.800" maxW={260}>
      <Box
        borderRadius="xl"
        borderWidth={1}
        borderColor="gray.800"
        overflow="hidden"
      >
        <Box
          bgGradient="to-b"
          gradientFrom="brand.500"
          gradientTo="brand.700"
          px={4}
          py={2}
          textAlign="center"
        >
          <styled.p fontWeight="semibold">
            {capitalCase(tournament.state)}
          </styled.p>
        </Box>
        {tournament?.state === TournamentsState.QUALIFYING && (
          <styled.p
            textAlign="center"
            py={8}
            fontSize="lg"
            fontWeight="semibold"
          >
            {tournament?.nextQualifyingLap?.driver.name}
          </styled.p>
        )}
      </Box>
    </Box>
  );
};

export default TournamentsOverviewPage;
