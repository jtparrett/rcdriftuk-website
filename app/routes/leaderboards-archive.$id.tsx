import {
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

  notFoundInvariant(userId, "User not found");

  const leaderboard = await prisma.leaderboards.findUnique({
    where: {
      id,
      userId,
    },
  });

  notFoundInvariant(leaderboard, "Leaderboard not found");

  return null;
};

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);
  const id = z.string().parse(args.params.id);

  notFoundInvariant(userId, "User not found");

  await prisma.leaderboards.update({
    where: {
      id,
      userId,
    },
    data: {
      archived: true,
    },
  });

  return redirect("/leaderboards");
};

const LeaderboardArchivePage = () => {
  return (
    <Container maxW={1100} px={2} py={10}>
      <ConfirmationForm
        title="Are you sure you want to archive this leaderboard?"
        disclaimer="This action cannot be undone."
        confirmText="Yes, Archive this leaderboard"
      />
    </Container>
  );
};

export default LeaderboardArchivePage;
