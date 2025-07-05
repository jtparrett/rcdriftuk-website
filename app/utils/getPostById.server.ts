import notFoundInvariant from "./notFoundInvariant";
import { prisma } from "./prisma.server";

export type GetPostById = Awaited<ReturnType<typeof getPostById>>;

export const getPostById = async (id: number, userId?: string) => {
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
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  notFoundInvariant(post);

  return post;
};
