import { styled } from "~/styled-system/jsx";
import { useUserNotificationCounts } from "~/utils/useUserNotificationCounts";

export const NotificationsBadge = () => {
  const { data: notificationCounts } = useUserNotificationCounts();

  if (notificationCounts.unreadNotifications === 0) {
    return null;
  }

  return (
    <styled.span
      pos="absolute"
      top={0}
      right={0}
      bgColor="brand.500"
      rounded="full"
      w={4}
      h={4}
      display="flex"
      alignItems="center"
      justifyContent="center"
      transform="translate(32%, -32%)"
      fontSize="xx-small"
      fontWeight="bold"
      fontFamily="mono"
    >
      {notificationCounts.unreadNotifications}
    </styled.span>
  );
};
