import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";
import { sendNotification } from "~/utils/sendNotification.server";

const extractTaggedUsers = (text: string): number[] => {
  if (!text) return [];

  // Extract @userid(firstname lastname) mentions and return unique user IDs
  const userIdMatches = text.match(/@(\d+)\([^)]+\)/g);
  if (!userIdMatches) return [];

  const userIds = userIdMatches
    .map((match) => {
      const idMatch = match.match(/@(\d+)\(/);
      return idMatch ? parseInt(idMatch[1], 10) : null;
    })
    .filter((id): id is number => id !== null);

  // Return unique user IDs
  return Array.from(new Set(userIds));
};

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

  // Extract tagged users from the comment content
  const taggedUserIds = extractTaggedUsers(data.comment);

  const comment = await prisma.postComments.create({
    data: {
      content: data.comment,
      postId: id,
      userId,
      parentId: data.replyId,
    },
    select: {
      id: true,
      postId: true,
      Posts: {
        select: {
          userId: true,
          user: {
            select: {
              pushToken: true,
            },
          },
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          image: true,
        },
      },
    },
  });

  // Create notifications
  const notificationsToCreate: {
    userId: string;
    commentId: number;
    pushToken: string | null;
  }[] = [];

  // Notification for the post author (if they're not the commenter)
  if (comment.Posts?.userId && comment.Posts.userId !== userId) {
    notificationsToCreate.push({
      userId: comment.Posts.userId,
      commentId: comment.id,
      pushToken: comment.Posts.user.pushToken,
    });
  }

  // Notifications for tagged users (if they're not the commenter and not already included)
  if (taggedUserIds.length > 0) {
    // Get user IDs from driverIds (since taggedUserIds are driverIds, we need to convert them to user IDs)
    const taggedUsers = await prisma.users.findMany({
      where: {
        driverId: {
          in: taggedUserIds,
        },
      },
      select: {
        id: true,
        driverId: true,
        pushToken: true,
      },
    });

    for (const taggedUser of taggedUsers) {
      // Don't notify the commenter or the post author (already handled above)
      if (
        taggedUser.id &&
        taggedUser.id !== userId &&
        taggedUser.id !== comment.Posts?.userId
      ) {
        notificationsToCreate.push({
          userId: taggedUser.id,
          commentId: comment.id,
          pushToken: taggedUser.pushToken,
        });
      }
    }
  }

  // Create all notifications at once
  if (notificationsToCreate.length > 0) {
    await Promise.all(
      notificationsToCreate.map((notification) =>
        sendNotification({
          pushToken: notification.pushToken,
          userId: notification.userId,
          comment,
        }),
      ),
    );
  }

  return null;
};
