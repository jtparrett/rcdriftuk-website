import { useAuth } from "@clerk/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

export const useUserNotificationCounts = () => {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ["user-notification-counts"],
    queryFn: async () => {
      const response = await fetch("/api/user/notifications-count");
      const data = await response.json();

      return z
        .object({
          unreadNotifications: z.number(),
        })
        .parse(data);
    },
    refetchInterval: 60000,
    enabled: !!userId,
    initialData: {
      unreadNotifications: 0,
    },
  });
};
