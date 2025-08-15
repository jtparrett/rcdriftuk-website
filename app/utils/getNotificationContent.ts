// Shared utility for generating notification content
// Can be used both on frontend and backend

export interface NotificationData {
  userId: string;
  comment?: {
    postId: number;
    Posts?: {
      userId: string;
    } | null;
    user: {
      firstName: string | null;
      lastName: string | null;
      image?: string | null;
    };
  } | null;
  like?: {
    postId: number | null;
    Posts?: {
      userId: string;
    } | null;
    user: {
      firstName: string | null;
      lastName: string | null;
      image?: string | null;
    };
  } | null;
}

export interface NotificationContent {
  text: string;
  title: string;
  userImage?: string | null;
  postId?: number;
}

export const getNotificationContent = (
  notification: NotificationData,
): NotificationContent | null => {
  const getUserName = (user: {
    firstName: string | null;
    lastName: string | null;
  }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return "Someone";
  };

  if (notification.comment) {
    const commenterName = getUserName(notification.comment.user);

    // Check if this is a mention (comment on someone else's post) or a comment on user's own post
    const isMention =
      notification.comment.Posts?.userId !== notification.userId;

    return {
      title: isMention ? "New Mention" : "New Comment",
      text: isMention
        ? `${commenterName} mentioned you in a comment`
        : `${commenterName} commented on your post`,
      userImage: notification.comment.user.image,
      postId: notification.comment.postId,
    };
  }

  if (notification.like) {
    const likerName = getUserName(notification.like.user);

    return {
      title: "New Like",
      text: `${likerName} liked your post`,
      userImage: notification.like.user.image,
      postId: notification.like.postId || undefined,
    };
  }

  return null;
};
