import { TournamentsState } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { capitalCase } from "change-case";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Box, Center, styled } from "~/styled-system/jsx";
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
          driver: {
            include: {
              laps: {
                where: {
                  scores: {
                    none: {},
                  },
                },
              },
            },
          },
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
    <Box p={1} borderWidth={1} rounded="3xl" borderColor="gray.800">
      <Center
        minH="60dvh"
        bgImage="url(/grid-bg.svg)"
        bgRepeat="repeat"
        bgSize="50px"
        bgPosition="center"
        borderWidth={1}
        rounded="2xl"
        borderColor="gray.800"
      >
        <Box
          bgColor="black"
          p={1}
          borderWidth={1}
          rounded="2xl"
          borderColor="gray.800"
          w={260}
          maxW="full"
          shadow="0 6px 32px black"
        >
          <Box
            borderRadius="xl"
            borderWidth={1}
            borderColor="brand.700"
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
            {tournament?.state === TournamentsState.QUALIFYING &&
              tournament.nextQualifyingLap && (
                <Box textAlign="center" py={8}>
                  <styled.p fontSize="lg" fontWeight="semibold">
                    {tournament.nextQualifyingLap.driver.name}
                  </styled.p>
                  <styled.p color="gray.500" fontSize="sm">
                    Qualifying Lap:{" "}
                    {tournament.qualifyingLaps -
                      (tournament.nextQualifyingLap.driver.laps.length ?? 0) +
                      1}
                  </styled.p>
                </Box>
              )}
          </Box>
        </Box>
      </Center>
    </Box>
  );
};

export default TournamentsOverviewPage;
