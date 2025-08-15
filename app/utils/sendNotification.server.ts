import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { getNotificationContent } from "~/utils/getNotificationContent";
import { prisma } from "~/utils/prisma.server";

interface SendNotificationParams {
  userId: string;
  pushToken?: string | null;
  comment?: {
    id: number;
    postId: number;
    Posts?: {
      userId: string;
    } | null;
    user: {
      firstName: string | null;
      lastName: string | null;
      image: string | null;
    };
  };
  like?: {
    id: number;
    postId: number | null;
    Posts?: {
      userId: string;
    } | null;
    user: {
      firstName: string | null;
      lastName: string | null;
      image: string | null;
    };
  };
}

// Create a new Expo SDK client
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: true,
});

export const sendNotification = async ({
  userId,
  comment,
  like,
  pushToken,
}: SendNotificationParams) => {
  // Create the database notification
  const notification = await prisma.userNotifications.create({
    data: {
      userId,
      commentId: comment?.id || null,
      likeId: like?.id || null,
    },
  });

  // Send push notification if token is available
  console.log("pushToken", pushToken);
  if (pushToken && Expo.isExpoPushToken(pushToken)) {
    console.log("pushToken is valid");
    try {
      if (comment || like) {
        const content = getNotificationContent({
          userId,
          comment,
          like,
        });

        console.log("content", content);

        if (content) {
          const message: ExpoPushMessage = {
            to: pushToken,
            sound: "default",
            title: content.title,
            body: content.text,
            data: {
              notificationId: notification.id,
              commentId: comment?.id || null,
              likeId: like?.id || null,
              postId: content.postId || null,
            },
          };

          await expo.sendPushNotificationsAsync([message]);

          console.log("push notification sent");
        }
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }

  return notification;
};
