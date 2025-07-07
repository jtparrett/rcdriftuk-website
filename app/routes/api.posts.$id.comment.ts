import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const action = async (args: ActionFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId);

  const id = z.coerce.number().parse(args.params.id);

  const formData = await args.request.json();
  const data = z
    .object({
      comment: z.string(),
    })
    .parse(formData);

  await prisma.postComments.create({
    data: {
      content: data.comment,
      postId: id,
      userId,
    },
  });

  return null;
};
