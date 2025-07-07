import { RiInformationFill } from "react-icons/ri";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { LinkOverlay } from "~/components/LinkOverlay";
import { PostCard } from "~/components/PostCard";
import {
  Box,
  Center,
  Container,
  Flex,
  Spacer,
  styled,
} from "~/styled-system/jsx";
import { getAuth } from "~/utils/getAuth.server";
import { getUser, type GetUser } from "~/utils/getUser.server";
import { prisma } from "~/utils/prisma.server";
import { userIsVerified } from "~/utils/userIsVerified";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  let user: GetUser = null;

  if (userId) {
    user = await getUser(userId);
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
          id: "asc",
        },
        take: 1,
      },
    },
  });

  return { posts, user };
};

const FeedPage = () => {
  const { posts, user } = useLoaderData<typeof loader>();
  const canPost = userIsVerified(user);

  return (
    <Container maxW={680} px={2}>
      {user && canPost && (
        <Flex
          pos="relative"
          px={4}
          py={3}
          alignItems="center"
          gap={3}
          bgColor="gray.900"
          mt={2}
          rounded="xl"
          borderWidth={1}
          borderColor="gray.800"
          overflow="hidden"
        >
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
              display="block"
              w="full"
              h="full"
              objectFit="cover"
            />
          </Box>
          <Center
            bgColor="gray.800"
            flex={1}
            h={10}
            px={5}
            rounded="full"
            justifyContent="flex-start"
          >
            <LinkOverlay to="/posts/new">
              What's on your mind, {user.firstName}?
            </LinkOverlay>
          </Center>
        </Flex>
      )}

      {!canPost && (
        <Flex
          bgColor="brand.900"
          rounded="xl"
          px={4}
          py={2}
          mt={2}
          borderWidth={1}
          borderColor="brand.800"
          color="brand.500"
          alignItems="center"
        >
          <styled.p fontSize="sm" textWrap="balance">
            To post on this feed, you must have a driver rating or be a verified
            track owner.
          </styled.p>
          <Spacer />
          <RiInformationFill />
        </Flex>
      )}

      <Flex flexDir="column" gap={2} py={2}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} user={user} />
        ))}
      </Flex>
    </Container>
  );
};

export default FeedPage;
