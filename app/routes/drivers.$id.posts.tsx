import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { z } from "zod";
import { Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import { getAuth } from "~/utils/getAuth.server";
import { PostCard } from "~/components/PostCard";
import { getUser, type GetUser } from "~/utils/getUser.server";
import notFoundInvariant from "~/utils/notFoundInvariant";

export const loader = async (args: LoaderFunctionArgs) => {
  const { params } = args;
  const driverId = z.coerce.number().parse(params.id);
  const { userId } = await getAuth(args);

  let user: GetUser | null = null;

  if (userId) {
    user = await getUser(userId);
  }

  const driver = await prisma.users.findFirst({
    where: {
      driverId,
    },
  });

  notFoundInvariant(driver, "Driver not found");

  const posts = await prisma.posts.findMany({
    where: {
      user: {
        driverId,
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

  return {
    posts,
    user,
  };
};

const Page = () => {
  const { posts, user } = useLoaderData<typeof loader>();

  return (
    <Flex gap={4} flexDir="column">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} user={user} />
      ))}
    </Flex>
  );
};

export default Page;
