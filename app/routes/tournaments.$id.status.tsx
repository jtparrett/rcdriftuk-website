import { TournamentsState } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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

const TournamentsStatusPage = () => {
  const tournament = useLoaderData<typeof loader>();

  return (
    <>
      {tournament?.state === TournamentsState.QUALIFYING && (
        <Box>
          <Box
            maxW={260}
            borderRadius="md"
            borderWidth={1}
            borderColor="gray.800"
            overflow="hidden"
            mb={6}
          >
            <Box bgColor="gray.800" px={4} py={2}>
              <styled.p fontWeight="semibold">Qualifying</styled.p>
            </Box>
            <styled.p
              textAlign="center"
              py={8}
              fontSize="lg"
              fontWeight="semibold"
            >
              {tournament?.nextQualifyingLap?.driver.name}
            </styled.p>
          </Box>
        </Box>
      )}
    </>
  );
};

export default TournamentsStatusPage;
