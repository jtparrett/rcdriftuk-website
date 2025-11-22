import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import z from "zod";
import { ConfirmationForm } from "~/components/ConfirmationForm";
import { Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  const tournament = await prisma.tournaments.findUnique({
    where: { id, userId },
  });

  notFoundInvariant(tournament, "Tournament not found");

  return null;
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  await prisma.tournaments.update({
    where: { id, userId },
    data: {
      ratingRequestedAt: new Date(),
    },
  });

  return redirect(`/tournaments/${id}/overview`);
};

const TournamentRatingRequestPage = () => {
  return (
    <Container maxW={1100} px={2} py={10}>
      <ConfirmationForm
        title="Are you sure you want this tournament to be rated?"
        disclaimer={`Rating this tournament will make it public to all users, and the results will impact driver ratings.

        A human will verify this request and the tournament will be rated within 1 week if approved.`}
        confirmText="Yes, Request Rating"
      />
    </Container>
  );
};

export default TournamentRatingRequestPage;
