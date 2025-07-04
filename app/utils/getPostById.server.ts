import notFoundInvariant from "./notFoundInvariant";
import { prisma } from "./prisma.server";

export type GetPostById = Awaited<ReturnType<typeof getPostById>>;

export const getPostById = async (id: number) => {
  const post = await prisma.posts.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      likes: {
        include: {
          user: true,
        },
      },
      comments: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  notFoundInvariant(post);

  return post;
};
