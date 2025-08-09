import {
  Form,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { ConfirmationForm } from "~/components/ConfirmationForm";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  const tournament = await prisma.tournaments.findUnique({
    where: {
      id,
      userId,
    },
  });

  notFoundInvariant(tournament, "Tournament not found");

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
      <ConfirmationForm
        title="Are you sure you want to archive this tournament?"
        disclaimer="This action cannot be undone."
        confirmText="Yes, Archive this tournament"
      />
    </Container>
  );
};

export default TournamentArchivePage;
