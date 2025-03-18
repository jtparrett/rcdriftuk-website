import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useParams } from "@remix-run/react";
import { styled, Box, VStack } from "~/styled-system/jsx";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/prisma.server";
import { sumScores } from "~/utils/sumScores";
import { TournamentsState } from "@prisma/client";
import { getAuth } from "~/utils/getAuth.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const { id, driverId, index } = params;
  const { userId } = await getAuth(args);

  invariant(userId, "Missing user id");

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      userId,
    },
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
      drivers: {
        where: {
          id: Number(driverId),
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          laps: {
            include: {
              scores: true,
            },
          },
        },
      },
    },
  });

  invariant(tournament, "Tournament not found");
  invariant(
    tournament.state === TournamentsState.QUALIFYING,
    "Tournament is not in qualifying"
  );
  invariant(tournament.drivers.length > 0, "Driver not found");

  const driver = tournament.drivers[0];
  const lap = driver.laps[Number(index)];

  invariant(lap, "Lap not found");

  return {
    tournament,
    driver,
    lap,
    totalJudges: tournament.judges.length,
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const judgeId = formData.get("judgeId");
  const score = formData.get("score");
  const lapId = formData.get("lapId");

  invariant(judgeId, "Missing judge id");
  invariant(score, "Missing score");
  invariant(lapId, "Missing lap id");

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
  const { tournament, driver, lap, totalJudges } =
    useLoaderData<typeof loader>();
  const params = useParams();
  const lapIndex = Number(params.index);

  return (
    <Box p={4}>
      <VStack gap={4} alignItems="stretch">
        <Box>
          <styled.h1 fontSize="2xl" fontWeight="bold">
            Edit Lap Score
          </styled.h1>
          <styled.p color="gray.400">
            {driver.user.firstName} {driver.user.lastName} - Lap {lapIndex + 1}
          </styled.p>
        </Box>

        <Box p={4} rounded="xl" bgColor="gray.900">
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
                {sumScores(lap.scores, totalJudges)}
              </styled.p>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default Page;
