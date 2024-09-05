import { TournamentsState } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import pluralize from "pluralize";
import { useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { z } from "zod";
import { Button } from "~/components/Button";
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
      event: true,
      nextQualifyingLap: {
        include: {
          scores: {
            where: {
              judgeId,
            },
          },
          driver: {
            include: {
              laps: {
                where: {
                  scores: {
                    none: {
                      judgeId,
                    },
                  },
                },
              },
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

const QualiForm = () => {
  const loaderData = useLoaderData<typeof loader>();
  const { tournament, judge } = loaderData;
  const transition = useNavigation();

  const [scoreValue, setScoreValue] = useState(100);

  const lapIsJudged = (tournament.nextQualifyingLap?.scores.length ?? 0) > 0;

  useEffect(() => {
    if (transition.state === "submitting") {
      setScoreValue(100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition]);

  return (
    <>
      {transition.state !== "idle" ? (
        <p>Loading...</p>
      ) : (
        <>
          {tournament.nextQualifyingLap !== null && !lapIsJudged ? (
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
                  Qualifying Lap{" "}
                  {tournament.qualifyingLaps -
                    (tournament.nextQualifyingLap.driver.laps.length ?? 0) +
                    1}
                </styled.span>
              </Flex>

              <Form
                method="post"
                action={`/judge/${judge.id}/lap/${tournament.nextQualifyingLapId}`}
              >
                <VStack alignItems="stretch" gap={6}>
                  <Box>
                    <Label>
                      Score ({scoreValue} {pluralize("point", scoreValue)})
                    </Label>

                    <Select
                      name="score"
                      aria-label="score-select"
                      value={scoreValue}
                      onChange={(e) => setScoreValue(parseInt(e.target.value))}
                    >
                      {Array.from(new Array(101)).map((_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </Select>
                  </Box>

                  <Button type="submit" disabled={transition.state !== "idle"}>
                    Submit
                  </Button>
                </VStack>
              </Form>
            </>
          ) : (
            <styled.h2 textAlign="center" fontSize="xl">
              Waiting for next qualifying lap...
            </styled.h2>
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
//               isDisabled={nextBattle.driverLeft?.isBuy}
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
//               isDisabled={nextBattle.driverRight?.isBuy}
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
  const loaderData = useLoaderData<typeof loader>();
  const { tournament, judge } = loaderData;

  return (
    <Container px={4} maxW={500} py={4}>
      <Flex p={4} textAlign="center" bgColor="gray.900" mb={4} rounded="lg">
        <styled.h1>{judge.name}</styled.h1>
        <Spacer />
        <styled.h2>{tournament.event.name}</styled.h2>
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
