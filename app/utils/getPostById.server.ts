import notFoundInvariant from "./notFoundInvariant";
import { prisma } from "./prisma.server";

export const getPostById = async (id: number, userId?: string | null) => {
  const post = await prisma.posts.findUnique({
    where: {
      id,
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

  notFoundInvariant(post, "Post not found");

  return post;
};

export type GetPostById = Awaited<ReturnType<typeof getPostById>>;
