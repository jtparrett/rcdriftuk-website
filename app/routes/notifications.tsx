import type { UserNotifications } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { LinkOverlay } from "~/components/LinkOverlay";
import { TabsBar } from "~/components/TabsBar";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getNotificationContent } from "~/utils/getNotificationContent";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  await prisma.users.update({
    where: {
      id: userId,
    },
    data: {
      notificationsLastReadAt: new Date(),
    },
  });

  const notifications = await prisma.userNotifications.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      comment: {
        select: {
          postId: true,
          Posts: {
            select: {
              userId: true,
            },
          },
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
      like: {
        select: {
          postId: true,
          Posts: {
            select: {
              userId: true,
            },
          },
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
    },
  });

  return notifications;
};

const NotificationsPage = () => {
  const notifications = useLoaderData<typeof loader>();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["user-notification-counts"],
    });
  }, [notifications]);

  return (
    <>
      <TabsBar>
        <styled.h1 fontSize="lg" fontWeight="extrabold">
          Notifications
        </styled.h1>
      </TabsBar>
      <Container maxW={1100} px={2} py={4}>
        {notifications.length === 0 && (
          <styled.p color="gray.500" textAlign="center">
            You don't have any notifications yet.
          </styled.p>
        )}

        <Flex flexDir="column" gap={2}>
          {notifications.map((notification) => {
            const content = getNotificationContent(notification);

            if (!content) {
              return null;
            }

            return (
              <Flex
                key={notification.id}
                borderWidth={1}
                borderColor="gray.800"
                bgColor="gray.900"
                p={4}
                borderRadius="xl"
                alignItems="center"
                gap={3}
                pos="relative"
                overflow="hidden"
              >
                <Box w={10} h={10} rounded="full" overflow="hidden">
                  <styled.img
                    src={content.userImage ?? "/blank-driver-right.jpg"}
                    alt="Avatar"
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                </Box>
                <Box>
                  <styled.p color="gray.400" fontSize="sm">
                    {formatDistanceToNow(notification.createdAt, {
                      addSuffix: true,
                    })}
                  </styled.p>
                  <LinkOverlay to={`/posts/${content.postId}`} replace>
                    <styled.p>{content.text}</styled.p>
                  </LinkOverlay>
                </Box>
              </Flex>
            );
          })}
        </Flex>
      </Container>
    </>
  );
};

export default NotificationsPage;
