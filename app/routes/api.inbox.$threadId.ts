import { type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const threadId = z.coerce.number().parse(args.params.threadId);

  const messages = await prisma.threadMessages.findMany({
    where: {
      threadId,
    },
    orderBy: {
      id: "asc",
    },
    take: 100,
    include: {
      threadUser: {
        include: {
          user: true,
        },
      },
    },
  });

  return { messages };
};
