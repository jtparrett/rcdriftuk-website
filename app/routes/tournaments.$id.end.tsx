import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { ConfirmationForm } from "~/components/ConfirmationForm";
import { Container } from "~/styled-system/jsx";
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

  notFoundInvariant(userId, "User not found");

  const tournament = await prisma.tournaments.findFirst({
    where: {
      id,
      userId,
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

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

  notFoundInvariant(tournament, "Tournament not found");

  await tournamentNextBattle(tournament.id);

  return redirect(`/tournaments/${id}/overview`);
};

const TournamentEndPage = () => {
  const tournament = useLoaderData<typeof loader>();

  return (
    <Container maxW={1100} px={2} py={10}>
      <ConfirmationForm
        title="Are you sure you want to end this tournament?"
        confirmText="Yes, End this tournament"
      />
    </Container>
  );
};

export default TournamentEndPage;
