import { TournamentsState } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { capitalCase, sentenceCase } from "change-case";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Glow } from "~/components/Glow";
import { Box, Center, Flex, styled } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import numberToWords from "number-to-words";
import { sumScores } from "~/utils/sumScores";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = z.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
    },
    include: {
      judges: true,
      nextQualifyingLap: {
        include: {
          scores: {
            include: {
              judge: true,
            },
          },
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

  const judgingComplete =
    (tournament.nextQualifyingLap?.scores.length ?? 0) ===
    tournament.judges.length;

  return (
    <Box
      p={1}
      borderWidth={1}
      rounded="3xl"
      bgColor="gray.900"
      borderColor="gray.800"
    >
      <Center
        minH="60dvh"
        bgColor="black"
        bgImage="url(/grid-bg.svg)"
        bgRepeat="repeat"
        bgSize="60px"
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
          borderColor="brand.500"
          w={260}
          mb={4}
          maxW="full"
          shadow="0 12px 32px rgba(236, 26, 85, 0.25)"
          pos="relative"
          zIndex={1}
        >
          <Glow />
          <Box
            borderRadius="xl"
            borderWidth={1}
            borderColor="brand.700"
            overflow="hidden"
            textAlign="center"
          >
            <Box
              bgGradient="to-b"
              gradientFrom="brand.500"
              gradientTo="brand.700"
              px={4}
              py={2}
              borderTopRadius="11px"
              boxShadow="inset 0 1px rgba(255, 255, 255, 0.3)"
            >
              <styled.p fontWeight="semibold">
                {capitalCase(tournament.state)}
              </styled.p>
            </Box>
            {tournament?.state === TournamentsState.QUALIFYING &&
              tournament.nextQualifyingLap && (
                <>
                  <Box pt={4} px={4}>
                    <styled.p fontSize="lg" fontWeight="black">
                      {tournament.nextQualifyingLap.driver.name}
                    </styled.p>

                    {!judgingComplete && (
                      <styled.p
                        color="gray.500"
                        fontSize="sm"
                        fontWeight="medium"
                        pb={4}
                      >
                        {sentenceCase(
                          numberToWords.toWordsOrdinal(
                            tournament.qualifyingLaps -
                              (tournament.nextQualifyingLap.driver.laps
                                .length ?? 0) +
                              1
                          )
                        )}{" "}
                        qualifying run
                      </styled.p>
                    )}
                  </Box>

                  {judgingComplete && (
                    <Box>
                      <styled.p fontSize="6xl" fontWeight="black" pb={4}>
                        {sumScores(
                          tournament.nextQualifyingLap.scores,
                          tournament.judges.length
                        )}
                      </styled.p>
                      <Flex textAlign="center" gap="1px">
                        {tournament.nextQualifyingLap.scores.map((score, i) => {
                          return (
                            <Box
                              key={i}
                              flex={1}
                              lineHeight="1"
                              py={2}
                              bgColor="gray.900"
                            >
                              <styled.p fontSize="lg">{score.score}</styled.p>
                              <styled.p fontSize="sm">
                                {score.judge.name}
                              </styled.p>
                            </Box>
                          );
                        })}
                      </Flex>
                    </Box>
                  )}
                </>
              )}
          </Box>
        </Box>
      </Center>
    </Box>
  );
};

export default TournamentsOverviewPage;
