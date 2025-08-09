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
    await prisma.postLikes.create({
      data: {
        postId: id,
        userId,
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
