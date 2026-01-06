import { prisma } from "./prisma.server";

const PAGE_SIZE = 4;

interface GetFeedPostsOptions {
  cursor?: number;
  userId?: string;
}

export async function getFeedPosts(options: GetFeedPostsOptions = {}) {
  const { cursor, userId } = options;

  const posts = await prisma.posts.findMany({
    where: cursor
      ? {
          id: {
            lt: cursor,
          },
        }
      : undefined,
    orderBy: {
      id: "desc",
    },
    take: PAGE_SIZE,
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
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
        take: 1,
      },
    },
  });

  return {
    posts,
  };
}
