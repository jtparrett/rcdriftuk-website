import type { LoaderFunctionArgs } from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
    select: {
      notificationsLastReadAt: true,
    },
  });

  notFoundInvariant(user, "User not found");

  const unreadNotifications = await prisma.userNotifications.count({
    where: {
      userId,
      createdAt: {
        gt: user.notificationsLastReadAt,
      },
    },
  });

  return {
    unreadNotifications,
  };
};
