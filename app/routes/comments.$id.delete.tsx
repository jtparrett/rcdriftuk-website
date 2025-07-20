import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { ConfirmationForm } from "~/components/ConfirmationForm";
import { Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.coerce.number().parse(args.params.id);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId);

  const comment = await prisma.postComments.findUnique({
    where: {
      id,
      userId,
    },
  });

  notFoundInvariant(comment);

  return comment;
};

export const action = async (args: ActionFunctionArgs) => {
  const id = z.coerce.number().parse(args.params.id);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId);

  const comment = await prisma.postComments.findUnique({
    where: {
      id,
      userId,
    },
  });

  notFoundInvariant(comment);

  await prisma.postComments.delete({
    where: {
      id,
      userId,
    },
  });

  return redirect(`/posts/${comment.postId}`);
};

const CommentDeletePage = () => {
  return (
    <Container maxW={1100} px={2} py={10}>
      <ConfirmationForm
        title="Are you sure you want to delete this comment?"
        confirmText="Delete"
      />
    </Container>
  );
};

export default CommentDeletePage;
