import { useQuery } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import notFoundInvariant from "~/utils/notFoundInvariant";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  return null;
};

const InboxPage = () => {
  const threadsQuery = useQuery({
    refetchInterval: 3000,
    queryKey: ["inbox-threads"],
    queryFn: async () => {
      const response = await fetch("/api/inbox");
      const data = await response.json();
      return z
        .array(
          z.object({
            id: z.number(),
            _count: z.object({
              users: z.number(),
            }),
            users: z.array(
              z.object({
                user: z.object({
                  id: z.string(),
                  firstName: z.string(),
                  lastName: z.string(),
                  image: z.string().optional().nullable(),
                }),
              }),
            ),
            messages: z.array(
              z.object({
                id: z.number(),
                content: z.string(),
                createdAt: z.coerce.date(),
              }),
            ),
          }),
        )
        .parse(data);
    },
  });

  return (
    <Container maxW={1100} px={2} py={4}>
      <styled.h1 fontSize="3xl" fontWeight="extrabold" mb={2}>
        Inbox
      </styled.h1>

      <Flex flexDir="column" gap={2}>
        {threadsQuery.data?.map((thread) => {
          const [latestMessage] = thread.messages;

          return (
            <Flex
              key={thread.id}
              borderWidth={1}
              bgColor="gray.900"
              borderColor="gray.800"
              borderRadius="lg"
              p={4}
              gap={4}
              alignItems="center"
            >
              <Flex w={12} h={12}>
                {thread.users.map((user, userIndex) => (
                  <Box
                    flex="none"
                    rounded="full"
                    overflow="hidden"
                    style={
                      {
                        "--size": `${48 * Math.max(1 / thread.users.length, 0.7)}px`,
                        "--align": userIndex === 0 ? "flex-end" : "flex-start",
                        "--ml": userIndex === 0 ? 0 : "-20px",
                        "--z": userIndex === 0 ? 1 : 0,
                      } as React.CSSProperties
                    }
                    w="var(--size)"
                    h="var(--size)"
                    alignSelf="var(--align)"
                    ml="var(--ml)"
                    borderWidth={1}
                    borderColor="brand.500"
                    shadow="0 2px 4px rgba(0, 0, 0, 0.5)"
                    zIndex="var(--z)"
                    pos="relative"
                  >
                    <styled.img
                      src={user.user.image ?? "/blank-driver-right.jpg"}
                      alt={`${user.user.firstName} ${user.user.lastName}`}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>
                ))}
              </Flex>

              <Box flex={1}>
                <styled.p
                  fontWeight="medium"
                  lineHeight={1.1}
                  letterSpacing="tight"
                >
                  {thread.users
                    .map(
                      (user) => `${user.user.firstName} ${user.user.lastName}`,
                    )
                    .join(", ")}

                  {thread._count.users > 2 && (
                    <>, + {thread._count.users - 2} more</>
                  )}
                </styled.p>

                <styled.p color="gray.500">
                  {latestMessage?.content ??
                    "New thread created, start the conversation..."}
                </styled.p>
              </Box>
            </Flex>
          );
        })}
      </Flex>
    </Container>
  );
};

export default InboxPage;
