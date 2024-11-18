import { TournamentsState } from "@prisma/client";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, redirect, useLoaderData, useNavigation } from "@remix-run/react";
import pluralize from "pluralize";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Label } from "~/components/Label";
import { Select } from "~/components/Select";
import {
  styled,
  Flex,
  Spacer,
  Box,
  VStack,
  Container,
} from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { useReloader } from "~/utils/useReloader";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const judgeId = z.coerce.string().parse(params.id);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      judges: {
        some: {
          id: judgeId,
        },
      },
    },
    include: {
      nextQualifyingLap: {
        include: {
          scores: {
            where: {
              judgeId,
            },
          },
          driver: {
            include: {
              laps: true,
            },
          },
        },
      },
      // nextBattle: {
      //   include: {
      //     driverLeft: {
      //       include: {
      //         driver: true,
      //       },
      //     },
      //     driverRight: {
      //       include: {
      //         driver: true,
      //       },
      //     },
      //   },
      // },
    },
  });

  const judge = await prisma.tournamentJudges.findFirst({
    where: {
      id: judgeId,
    },
  });

  // const battleVote = await prisma.battleVotes.findFirst({
  //   where: {
  //     battleId: tournament?.nextBattleId ?? undefined,
  //     judgeId,
  //   },
  // });

  invariant(tournament);
  invariant(judge, "No Judge Found");

  return {
    tournament,
    judge,
    // battleVote
  };
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const judgeId = z.coerce.string().parse(params.id);

  const judge = await prisma.tournamentJudges.findFirstOrThrow({
    where: {
      id: judgeId,
    },
    include: {
      tournament: true,
    },
  });

  if (
    judge.tournament.state === TournamentsState.QUALIFYING &&
    judge.tournament.nextQualifyingLapId
  ) {
    const formData = await request.formData();
    const score = z.coerce.number().parse(formData.get("score"));

    await prisma.lapScores.upsert({
      where: {
        judgeId_lapId: {
          judgeId,
          lapId: judge.tournament.nextQualifyingLapId,
        },
      },
      update: {
        score,
      },
      create: {
        judgeId,
        lapId: judge.tournament.nextQualifyingLapId,
        score,
      },
    });
  }

  return redirect(`/judge/${judgeId}`);
};

const QualiForm = () => {
  const { tournament } = useLoaderData<typeof loader>();
  const transition = useNavigation();

  const scoreValue = tournament.nextQualifyingLap?.scores[0]?.score ?? 50;
  const qualifyingRun =
    (tournament.nextQualifyingLap?.driver?.laps?.findIndex(
      (lap) => lap.id === tournament.nextQualifyingLapId
    ) ?? 0) + 1;

  useReloader();

  return (
    <>
      {transition.state !== "idle" ? (
        <p>Loading...</p>
      ) : (
        <>
          {tournament.nextQualifyingLap !== null && (
            <>
              <Flex mb={6}>
                <styled.p fontWeight="semibold">
                  #
                  {tournament.nextQualifyingLap.driver.id
                    .toString()
                    .padStart(2, "0")}{" "}
                  {tournament.nextQualifyingLap.driver.name}
                </styled.p>
                <Spacer />
                <styled.span color="brand.500" fontWeight="bold">
                  Qualifying Run {qualifyingRun}
                </styled.span>
              </Flex>

              <Form method="post">
                <VStack alignItems="stretch" gap={6}>
                  <Box>
                    <Label>
                      Score ({scoreValue} {pluralize("point", scoreValue)})
                    </Label>

                    <Select
                      name="score"
                      aria-label="score-select"
                      value={scoreValue}
                      onChange={(e) => {
                        e.target.form?.submit();
                      }}
                    >
                      {Array.from(new Array(101)).map((_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </Select>
                  </Box>
                </VStack>
              </Form>
            </>
          )}
        </>
      )}
    </>
  );
};

// const BattleForm = () => {
//   const loaderData = useLoaderData<typeof loader>();
//   const { tournament, judge, battleVote, replay1, replay2 } = loaderData;
//   const nextBattle = tournament.nextBattle;

//   return (
//     <>
//       {nextBattle?.winnerId !== null && (
//         <Heading fontSize="xl" textAlign="center" py={20}>
//           Waiting for next battle...
//         </Heading>
//       )}

//       {nextBattle !== null && nextBattle.winnerId === null && (
//         <Form
//           method="post"
//           action={`/tournaments/${nextBattle.tournamentId}/judge/${judge.id}/battle`}
//         >
//           <VStack alignItems="stretch" py={20} spacing={6}>
//             <Button
//               w="full"
//               isDisabled={nextBattle.driverLeft?.isBye}
//               type="submit"
//               name="driver"
//               value={nextBattle.driverLeft?.id.toString()}
//               colorScheme={
//                 battleVote?.winnerId === nextBattle.driverLeftId
//                   ? "blue"
//                   : undefined
//               }
//             >
//               {nextBattle.driverLeft?.driver.name}
//             </Button>

//             <Button
//               w="full"
//               isDisabled={nextBattle.driverRight?.isBye}
//               type="submit"
//               name="driver"
//               value={nextBattle.driverRight?.id.toString()}
//               colorScheme={
//                 battleVote?.winnerId === nextBattle.driverRightId
//                   ? "blue"
//                   : undefined
//               }
//             >
//               {nextBattle.driverRight?.driver.name}
//             </Button>

//             <Button
//               mt={4}
//               w="full"
//               type="submit"
//               name="omt"
//               value="true"
//               colorScheme={battleVote?.omt ? "blue" : undefined}
//             >
//               OMT
//             </Button>
//           </VStack>
//         </Form>
//       )}

//       <Divider mb={8} />

//       {replay1 && (
//         <Box mb={2}>
//           <video src={`/replays/${replay1}`} controls muted />
//         </Box>
//       )}

//       {replay2 && (
//         <Box>
//           <video src={`/replays/${replay2}`} controls muted />
//         </Box>
//       )}
//     </>
//   );
// };

const JudgePage = () => {
  const { tournament, judge } = useLoaderData<typeof loader>();

  return (
    <Container px={4} maxW={500} py={4}>
      <Flex p={4} textAlign="center" bgColor="gray.900" mb={4} rounded="lg">
        <styled.h1>{judge.name}</styled.h1>
        <Spacer />
        <styled.h2>{tournament.name}</styled.h2>
      </Flex>

      {tournament.state === TournamentsState.QUALIFYING && <QualiForm />}
      {/* {tournament.state === TournamentsState.BATTLES && <BattleForm />} */}

      {tournament.state === TournamentsState.END && (
        <styled.h2 textAlign="center" fontSize="xl">
          Competition Complete
        </styled.h2>
      )}
    </Container>
  );
};

export default JudgePage;
