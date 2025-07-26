import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { PostCard } from "~/components/PostCard";
import { Box, Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getPostById } from "~/utils/getPostById.server";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/posts.$id._index";
import { PostCommentForm } from "~/components/PostCommentForm";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: "RC Drift UK | Post",
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.coerce.number().parse(args.params.id);
  const { userId } = await getAuth(args);

  const post = await getPostById(id, userId);

  let user = null;

  if (userId) {
    user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });
  }

  return { post, user };
};

const PostPage = () => {
  const { post, user } = useLoaderData<typeof loader>();

  return (
    <>
      <Container
        maxW={680}
        px={2}
        py={4}
        minH={{
          base: "calc(100dvh - 220px)",
          lg: "unset",
        }}
      >
        <PostCard post={post} allowComment user={user} />
      </Container>
      {user && (
        <Box
          pos="sticky"
          bottom={0}
          bgColor="rgba(12, 12, 12, 0.75)"
          backdropFilter="blur(10px)"
          zIndex={100}
          borderTopWidth={1}
          borderColor="gray.900"
          pb="env(safe-area-inset-bottom)"
        >
          <Container maxW={680} py={2} px={3}>
            <PostCommentForm post={post} user={user} />
          </Container>
        </Box>
      )}
    </>
  );
};

export default PostPage;
