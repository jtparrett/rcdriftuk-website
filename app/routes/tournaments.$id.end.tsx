import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { Flex, styled } from "~/styled-system/jsx";

import { Box, Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { tournamentNextBattle } from "~/utils/tournamentNextBattle";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const { id } = z
    .object({
      id: z.string(),
    })
    .parse(args.params);

  notFoundInvariant(userId);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      userId,
    },
  });

  notFoundInvariant(tournament);

  return tournament;
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  const { id } = z
    .object({
      id: z.string(),
    })
    .parse(args.params);

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      userId,
    },
  });

  notFoundInvariant(tournament);

  await tournamentNextBattle(tournament.id);

  return redirect(`/tournaments/${id}/overview`);
};

const TournamentEndPage = () => {
  const tournament = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={2} py={10}>
      <Box
        bg="gray.900"
        p={8}
        borderRadius="2xl"
        mx="auto"
        maxW={500}
        textAlign="center"
      >
        <styled.h1 fontWeight="extrabold" fontSize="2xl">
          End {tournament.name}
        </styled.h1>
        <Form method="post">
          <styled.p mb={4}>
            Are you sure you want to end this tournament?
          </styled.p>
          <Flex gap={2} justifyContent="center">
            <LinkButton
              to={`/tournaments/${tournament.id}/overview`}
              variant="secondary"
            >
              Cancel
            </LinkButton>
            <Button type="submit">Yes, End this tournament</Button>
          </Flex>
        </Form>
      </Box>
    </Container>
  );
};

export default TournamentEndPage;
