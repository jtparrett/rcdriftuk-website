import { RiArrowRightLine, RiInformationFill } from "react-icons/ri";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
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
import { userIsVerified } from "~/utils/userIsVerified";
import type { Route } from "./+types/feed";
import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import { TabsBar } from "~/components/TabsBar";
import { AppName } from "~/utils/enums";
import { getFeedPosts } from "~/utils/getFeedPosts.server";

export const meta: Route.MetaFunction = () => {
  return [
    { title: `${AppName} | Community Feed` },
    {
      name: "description",
      content: "Welcome to the community feed",
    },
    {
      property: "og:image",
      content: "https://rcdrift.io/og-image.jpg",
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  let user: GetUser = null;

  if (userId) {
    user = await getUser(userId);
  }

  const { posts } = await getFeedPosts({ userId: userId || undefined });

  return { user, posts };
};

const FeedPage = () => {
  const { user, posts } = useLoaderData<typeof loader>();
  const canPost = userIsVerified(user);
  const loadMoreRef = useRef(null);
  const isInView = useInView(loadMoreRef);

  useEffect(() => {
    if (isInView) {
      fetchNextPage();
    }
  }, [isInView]);

  const { data, fetchNextPage } = useInfiniteQuery({
    queryKey: ["feed-posts"],
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams();

      if (pageParam) {
        searchParams.set("cursor", pageParam.toString());
      }

      const response = await fetch(`/api/feed/posts?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      return response.json();
    },
    initialData: {
      pages: [{ posts }],
      pageParams: [null],
    },
    refetchOnMount: false,
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.posts.length) return undefined;
      const lastPost = lastPage.posts[lastPage.posts.length - 1];
      return lastPost.id;
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
          <Box
            bgImage="url(/2026-bg.webp)"
            bgSize="cover"
            bgPosition="center"
            bgRepeat="no-repeat"
            rounded="xl"
            pos="relative"
            zIndex={1}
            borderWidth={1}
            borderColor="gray.800"
            overflow="hidden"
            _after={{
              content: '""',
              pos: "absolute",
              inset: 0,
              bgGradient: "to-br",
              gradientFrom: "rgba(0, 0, 0, 0.6)",
              gradientTo: "rgba(0, 0, 0, 0.9)",
              zIndex: -1,
            }}
          >
            <Flex justifyContent="center" alignItems="center" gap={2} py={8}>
              <LinkOverlay to="/2026">
                <styled.p
                  fontSize="2xl"
                  fontWeight="bold"
                  textShadow="0 4px 8px black"
                >
                  Join the 2026 Season
                </styled.p>
              </LinkOverlay>
              <RiArrowRightLine />
            </Flex>
          </Box>

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
