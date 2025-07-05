import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { PostCard } from "~/components/PostCard";
import { Container } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getPostById } from "~/utils/getPostById.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.coerce.number().parse(args.params.id);
  const { userId } = await getAuth(args);

  const post = await getPostById(id);

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
    <Container maxW={680} px={2} py={4}>
      <PostCard post={post} allowComment user={user} />
    </Container>
  );
};

export default PostPage;
