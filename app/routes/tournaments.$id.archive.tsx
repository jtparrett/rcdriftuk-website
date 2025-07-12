import {
  Form,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { Button, LinkButton } from "~/components/Button";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  const tournament = await prisma.tournaments.findUnique({
    where: {
      id,
      userId,
    },
  });

  notFoundInvariant(tournament);

  return null;
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  await prisma.tournaments.update({
    where: {
      id,
      userId,
    },
    data: {
      archived: true,
    },
  });

  return redirect("/tournaments");
};

const TournamentArchivePage = () => {
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
        <Form method="post">
          <styled.h1 mb={4} fontWeight="medium" fontSize="2xl" lineHeight="1.2">
            Are you sure you want to archive this tournament?
          </styled.h1>
          <styled.p color="brand.500" fontWeight="semibold" mb={4}>
            This action cannot be undone.
          </styled.p>
          <Flex gap={2} justifyContent="center">
            <LinkButton to="/tournaments" variant="secondary">
              Cancel
            </LinkButton>
            <Button type="submit">Yes, Archive this tournament</Button>
          </Flex>
        </Form>
      </Box>
    </Container>
  );
};

export default TournamentArchivePage;
