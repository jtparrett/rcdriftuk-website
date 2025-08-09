import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const id = z.coerce.number().parse(args.params.id);

  const formData = await args.request.json();
  const data = z
    .object({
      comment: z.string(),
      replyId: z.coerce.number().nullable(),
    })
    .parse(formData);

  await prisma.postComments.create({
    data: {
      content: data.comment,
      postId: id,
      userId,
      parentId: data.replyId,
    },
  });

  return null;
};
