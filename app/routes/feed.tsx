import { RiImage2Line } from "react-icons/ri";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { LinkOverlay } from "~/components/LinkOverlay";
import { PostCard } from "~/components/PostCard";
import { Box, Container, Flex, Spacer, styled } from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  let user = null;

  if (userId) {
    user = await prisma.users.findFirst({
      where: {
        id: userId,
      },
    });
  }

  const posts = await prisma.posts.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      ...(userId
        ? {
            likes: {
              where: {
                userId,
              },
            },
          }
        : {}),
      comments: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  return { posts, user };
};

const FeedPage = () => {
  const { posts, user } = useLoaderData<typeof loader>();

  return (
    <>
      {user && (
        <Box borderBottomWidth={1} borderColor="gray.900" mb={2}>
          <Container maxW={680} px={0}>
            <Flex pos="relative" px={6} py={3} alignItems="center" gap={3}>
              <Box
                rounded="full"
                overflow="hidden"
                w={10}
                h={10}
                borderWidth={1}
                borderColor="gray.800"
              >
                <styled.img
                  src={user.image ?? "/blank-driver-right.jpg"}
                  alt={`${user.firstName} ${user.lastName}`}
                />
              </Box>
              <LinkOverlay to="/posts/new">Whats on your mind?</LinkOverlay>
              <Spacer />
              <RiImage2Line size={20} />
            </Flex>
          </Container>
        </Box>
      )}
      <Container maxW={680} px={0}>
        <Flex flexDir="column" gap={2} p={2}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} user={user} />
          ))}
        </Flex>
      </Container>
    </>
  );
};

export default FeedPage;
