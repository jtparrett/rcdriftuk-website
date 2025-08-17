import type { LoaderFunctionArgs } from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const threads = await prisma.threads.findMany({
    where: {
      users: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
      _count: {
        select: {
          users: {
            where: {
              NOT: {
                userId,
              },
            },
          },
        },
      },
      users: {
        where: {
          NOT: {
            userId,
          },
        },
        take: 2,
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          threadUser: {
            select: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Sort threads by the latest message timestamp
  const sortedThreads = threads.sort((a, b) => {
    const aLatestMessage = a.messages[0];
    const bLatestMessage = b.messages[0];

    if (!aLatestMessage && !bLatestMessage) return 0;
    if (!aLatestMessage) return 1;
    if (!bLatestMessage) return -1;

    return (
      new Date(bLatestMessage.createdAt).getTime() -
      new Date(aLatestMessage.createdAt).getTime()
    );
  });

  return sortedThreads;
};
