import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData } from "react-router";
import { styled, Box, VStack } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { sumScores } from "~/utils/sumScores";
import { TournamentsState } from "~/utils/enums";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const { lapId } = params;
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "Missing user id");

  const lap = await prisma.laps.findFirst({
    where: {
      id: Number(lapId),
      driver: {
        tournament: {
          userId,
          state: TournamentsState.QUALIFYING,
        },
      },
    },
    include: {
      scores: true,
      driver: {
        include: {
          tournament: {
            include: {
              judges: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  notFoundInvariant(lap, "Lap not found");
  notFoundInvariant(lap.driver.tournament, "Tournament not found");

  return {
    lap,
    totalJudges: lap.driver.tournament.judges.length,
    tournament: lap.driver.tournament,
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const judgeId = formData.get("judgeId");
  const score = formData.get("score");
  const lapId = formData.get("lapId");

  notFoundInvariant(judgeId, "Missing judge id");
  notFoundInvariant(score, "Missing score");
  notFoundInvariant(lapId, "Missing lap id");

  await prisma.lapScores.update({
    where: {
      judgeId_lapId: {
        judgeId: String(judgeId),
        lapId: Number(lapId),
      },
    },
    data: {
      score: Number(score),
    },
  });

  return null;
};

const Page = () => {
  const { lap, totalJudges, tournament } = useLoaderData<typeof loader>();

  return (
    <Box maxW="500px">
      <VStack gap={4} alignItems="stretch">
        <styled.h1 fontSize="2xl" fontWeight="bold">
          Edit Qualifying Score
        </styled.h1>

        <Box p={6} rounded="xl" bgColor="gray.900">
          <VStack gap={4} alignItems="stretch">
            {tournament.judges.map((judge) => {
              const score = lap.scores.find((s) => s.judgeId === judge.id);
              return (
                <Box key={judge.id}>
                  <styled.label display="block" mb={2}>
                    {judge.user.firstName} {judge.user.lastName}
                  </styled.label>
                  <Form method="post">
                    <input type="hidden" name="judgeId" value={judge.id} />
                    <input type="hidden" name="lapId" value={lap.id} />
                    <styled.select
                      name="score"
                      defaultValue={score?.score ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        e.target.form?.submit();
                      }}
                      w="full"
                      p={2}
                      rounded="md"
                      bgColor="gray.800"
                      borderWidth={1}
                      borderColor="gray.700"
                      color="white"
                    >
                      <option value="">Select a score</option>
                      {Array.from(new Array(101)).map((_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </styled.select>
                  </Form>
                </Box>
              );
            })}

            <Box pt={4}>
              <styled.p fontWeight="bold">Total Score:</styled.p>
              <styled.p fontSize="2xl">
                {sumScores(
                  lap.scores,
                  totalJudges,
                  tournament.scoreFormula,
                  lap.penalty,
                )}
              </styled.p>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default Page;
