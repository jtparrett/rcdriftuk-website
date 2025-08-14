import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const id = z.coerce.number().parse(args.params.id);

  const existingLike = await prisma.postLikes.findFirst({
    where: {
      postId: id,
      userId,
    },
  });

  if (existingLike) {
    await prisma.postLikes.delete({
      where: {
        id: existingLike.id,
      },
    });
  } else {
    const like = await prisma.postLikes.create({
      data: {
        postId: id,
        userId,
      },
      select: {
        id: true,
        Posts: {
          select: {
            userId: true,
          },
        },
      },
    });

    // This should never happen, but just in case
    notFoundInvariant(like.Posts?.userId, "Post user not found");

    await prisma.userNotifications.create({
      data: {
        userId: like.Posts?.userId,
        likeId: like.id,
      },
    });
  }

  const totalPostLikes = await prisma.postLikes.count({
    where: {
      postId: id,
    },
  });

  return {
    totalPostLikes,
    userLiked: !existingLike,
  };
};
