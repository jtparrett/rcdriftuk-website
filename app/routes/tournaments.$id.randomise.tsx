import {
  Form,
  redirect,
  useParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { Box, Flex, Spacer, styled } from "~/styled-system/jsx";
import { TournamentsState } from "~/utils/enums";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  const tournament = await prisma.tournaments.findUnique({
    where: {
      id,
      state: TournamentsState.QUALIFYING,
      userId,
    },
  });

  notFoundInvariant(tournament);

  return null;
};

export const action = async (args: ActionFunctionArgs) => {
  const id = z.string().parse(args.params.id);
  const { userId } = await getAuth(args);

  const tournament = await prisma.tournaments.findUnique({
    where: {
      id,
      state: TournamentsState.QUALIFYING,
      userId,
    },
  });

  notFoundInvariant(tournament);

  await prisma.lapScores.deleteMany({
    where: {
      judge: {
        tournamentId: id,
      },
    },
  });

  const judges = await prisma.tournamentJudges.findMany({
    where: {
      tournamentId: id,
    },
  });

  const drivers = await prisma.tournamentDrivers.findMany({
    where: {
      tournamentId: id,
    },
    include: {
      laps: true,
    },
  });

  await prisma.lapScores.createMany({
    data: drivers.flatMap((driver) => {
      return judges.flatMap((judge) => {
        return driver.laps.flatMap((lap) => {
          return {
            score: Math.floor(Math.random() * 100),
            lapId: lap.id,
            judgeId: judge.id,
          };
        });
      });
    }),
  });

  await prisma.tournaments.update({
    where: {
      id,
    },
    data: {
      nextQualifyingLapId: null,
    },
  });

  return redirect(`/tournaments/${id}/qualifying`);
};

const RandomiseQualifyingPage = () => {
  const params = useParams();
  const id = z.string().parse(params.id);

  return (
    <Box
      maxW={600}
      mx="auto"
      p={6}
      borderWidth={1}
      borderColor="gray.800"
      rounded="xl"
      bg="gray.900"
    >
      <styled.h1
        fontSize="2xl"
        fontWeight="semibold"
        lineHeight="1.2"
        mb={4}
        textWrap="balance"
      >
        Are you sure you want to randomise qualifying?
      </styled.h1>
      <styled.p mb={2} color="gray.400">
        This will randomise the qualifying results for all drivers and allow for
        random battle pairings to be generated.
      </styled.p>
      <styled.p color="brand.500" fontWeight="semibold" mb={4}>
        This action cannot be undone.
      </styled.p>
      <Flex gap={2} pt={4} borderTopWidth={1} borderColor="gray.800">
        <Spacer />
        <LinkButton variant="outline" to={`/tournaments/${id}/qualifying`}>
          Cancel
        </LinkButton>
        <Form method="post">
          <Button type="submit">Yes, Randomise</Button>
        </Form>
      </Flex>
    </Box>
  );
};

export default RandomiseQualifyingPage;
