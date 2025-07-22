import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { PostCard } from "~/components/PostCard";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUser, type GetUser } from "~/utils/getUser.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const slug = z.string().parse(params.slug);
  const { userId } = await getAuth(args);

  let user: GetUser = null;

  if (userId) {
    user = await getUser(userId);
  }

  const posts = await prisma.posts.findMany({
    where: {
      track: {
        slug,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      track: {
        select: {
          id: true,
          slug: true,
          name: true,
          image: true,
        },
      },
      ...(userId
        ? {
            likes: {
              where: {
                userId,
              },
            },
          }
        : {}),
      comments: {
        where: {
          parentId: null,
        },
        include: {
          user: true,
          replies: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  return { posts, user };
};

const TrackFeedPage = () => {
  const { posts, user } = useLoaderData<typeof loader>();

  return (
    <Flex p={4} flexDir="column" gap={4}>
      {posts.length <= 0 && <styled.p>No posts here yet...</styled.p>}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} user={user} />
      ))}
    </Flex>
  );
};

export default TrackFeedPage;
