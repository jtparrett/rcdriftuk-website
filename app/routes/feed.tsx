import { RiInformationFill } from "react-icons/ri";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LinkOverlay } from "~/components/LinkOverlay";
import { PostCard } from "~/components/PostCard";
import { Button } from "~/components/Button";
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
import { userIsVerified } from "~/utils/userIsVerified";
import type { Route } from "./+types/feed";
import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { TabsBar } from "~/components/TabsBar";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "RC Drift UK | Community Feed" },
    {
      name: "description",
      content: "Welcome to the RCDrift.uk community feed",
    },
    {
      property: "og:image",
      content: "https://rcdrift.uk/og-image.jpg",
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  let user: GetUser = null;

  if (userId) {
    user = await getUser(userId);
  }

  return { user };
};

const FeedPage = () => {
  const { user } = useLoaderData<typeof loader>();
  const canPost = userIsVerified(user);
  const loadMoreRef = useRef(null);
  const isInView = useInView(loadMoreRef);

  useEffect(() => {
    if (isInView) {
      fetchNextPage();
    }
  }, [isInView]);

  // Helper function to calculate cursor values from a post
  const getCursorFromPost = (post: any) => {
    const cursor = {
      cursorScore: (post as any)._score,
      cursorId: post.id,
    };

    return cursor;
  };

  const { data, fetchNextPage } = useInfiniteQuery({
    queryKey: ["feed-posts"],
    queryFn: async ({ pageParam }) => {
      // All pages - fetch from API
      const searchParams = new URLSearchParams();

      if (pageParam) {
        searchParams.set("cursorScore", pageParam.cursorScore.toString());
        searchParams.set("cursorId", pageParam.cursorId.toString());
        searchParams.set("timestamp", pageParam.timestamp);
      }

      const response = await fetch(`/api/feed/posts?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      return response.json();
    },
    refetchOnMount: false,
    initialPageParam: null as any,
    getNextPageParam: (lastPage) => {
      if (!lastPage.posts.length) return undefined;
      const lastPost = lastPage.posts[lastPage.posts.length - 1];
      return {
        ...getCursorFromPost(lastPost),
        timestamp: lastPage.timestamp,
      };
    },
  });

  // Flatten all pages into a single array of posts
  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <>
      {user && canPost && (
        <TabsBar>
          <Flex gap={1.5} w="664px" maxW="full" mx="auto">
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
        </TabsBar>
      )}

      <Container maxW={680} px={2}>
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
              To post on this feed, you must have a driver rating or be a
              verified track owner.
            </styled.p>
            <Spacer />
            <RiInformationFill />
          </Flex>
        )}

        <Flex flexDir="column" gap={2} py={2}>
          {allPosts.map((post) => (
            <PostCard key={post.id} post={post} user={user} />
          ))}
        </Flex>

        <Box ref={loadMoreRef} h={10} />
      </Container>
    </>
  );
};

export default FeedPage;
