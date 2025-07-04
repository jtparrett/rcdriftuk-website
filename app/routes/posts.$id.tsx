import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { PostCard } from "~/components/PostCard";
import { Container } from "~/styled-system/jsx";
import { getPostById } from "~/utils/getPostById.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const id = z.coerce.number().parse(args.params.id);
  return getPostById(id);
};

const PostPage = () => {
  const post = useLoaderData<typeof loader>();

  return (
    <Container maxW={680} px={2} py={4}>
      <PostCard post={post} />
    </Container>
  );
};

export default PostPage;
