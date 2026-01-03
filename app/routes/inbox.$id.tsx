import { useQuery } from "@tanstack/react-query";
import {
  useLoaderData,
  useParams,
  type LoaderFunctionArgs,
} from "react-router";
import { z } from "zod";
import { ThreadMessageForm } from "~/components/ThreadMessageForm";
import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUser } from "~/utils/getUser.server";
import invariant from "~/utils/invariant";
import notFoundInvariant from "~/utils/notFoundInvariant";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);

  notFoundInvariant(userId, "User not found");

  const user = await getUser(userId);

  return { user };
};

const InboxThreadPage = () => {
  const { user } = useLoaderData<typeof loader>();
  const { id: threadId } = useParams();

  invariant(threadId, "Thread ID is required");

  const threadMessagesQuery = useQuery({
    queryKey: ["thread-messages", threadId],
    async queryFn() {
      const response = await fetch(`/api/inbox/${threadId}`);
      const data = await response.json();

      return z
        .object({
          messages: z.array(
            z.object({
              id: z.number(),
              content: z.string(),
              createdAt: z.coerce.date(),
              threadUser: z.object({
                user: z.object({
                  id: z.string(),
                  firstName: z.string(),
                  lastName: z.string(),
                  image: z.string().optional().nullable(),
                }),
              }),
            }),
          ),
        })
        .parse(data);
    },
  });

  return (
    <>
      <Container maxW={680} py={2} px={3}>
        <Flex flexDir="column" gap={2}>
          {threadMessagesQuery.data?.messages.map((message) => {
            const isCurrentUser = message.threadUser.user.id === user?.id;

            return (
              <Flex
                key={message.id}
                alignItems="flex-end"
                gap={2}
                flexDir={isCurrentUser ? "row-reverse" : "row"}
              >
                <Box w={10} h={10} rounded="full" overflow="hidden">
                  <styled.img
                    src={
                      message.threadUser.user.image ?? "/blank-driver-right.jpg"
                    }
                    objectFit="cover"
                    w="full"
                    h="full"
                  />
                </Box>
                <Box flex={1}>
                  <styled.p
                    fontWeight="medium"
                    fontSize="xs"
                    color="gray.400"
                    mx={4}
                    textAlign={isCurrentUser ? "right" : "left"}
                  >
                    {message.threadUser.user.firstName}{" "}
                    {message.threadUser.user.lastName}
                  </styled.p>
                  <Box
                    w="fit-content"
                    rounded="3xl"
                    py={2}
                    px={4}
                    bgColor={isCurrentUser ? "brand.500" : "gray.800"}
                    maxW="75%"
                    ml={isCurrentUser ? "auto" : 0}
                  >
                    <styled.p>{message.content}</styled.p>
                  </Box>
                </Box>
              </Flex>
            );
          })}
        </Flex>
      </Container>

      <Box
        pos="sticky"
        bottom={0}
        bgColor="rgba(12, 12, 12, 0.75)"
        backdropFilter="blur(10px)"
        zIndex={1}
        borderTopWidth={1}
        borderColor="gray.900"
      >
        <Container maxW={680} py={2} px={3}>
          <ThreadMessageForm user={user} />
        </Container>
      </Box>
    </>
  );
};

export default InboxThreadPage;
