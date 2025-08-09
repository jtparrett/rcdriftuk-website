import {
  type ActionFunctionArgs,
  redirect,
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

  notFoundInvariant(userId, "User not found");

  const post = await prisma.posts.findUnique({
    where: {
      id,
      userId,
    },
  });

  notFoundInvariant(post, "Post not found");

  return post;
};

export const action = async (args: ActionFunctionArgs) => {
  const id = z.coerce.number().parse(args.params.id);
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  await prisma.posts.delete({
    where: {
      id,
      userId,
    },
  });

  return redirect("/feed");
};

const PostDeletePage = () => {
  return (
    <Container maxW={1100} px={2} py={10}>
      <ConfirmationForm
        title="Are you sure you want to delete this post?"
        confirmText="Yes, Delete"
      />
    </Container>
  );
};

export default PostDeletePage;
