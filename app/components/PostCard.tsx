import { formatDistanceToNow } from "date-fns";
import { Box, Center, Flex, Spacer, styled } from "~/styled-system/jsx";
import { Button, LinkButton } from "./Button";
import {
  RiChat3Line,
  RiDeleteBinFill,
  RiShareForwardFill,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";
import type { GetPostById } from "~/utils/getPostById.server";
import { Markdown } from "./Markdown";
import { Link } from "react-router";
import pluralize from "pluralize";
import { useLikePost, usePostLikes } from "~/utils/usePostLikes";
import { usePostComments } from "~/utils/usePostComments";
import type { GetUser } from "~/utils/getUser.server";
import { LinkOverlay } from "./LinkOverlay";
import { css } from "~/styled-system/css";
import { Carousel } from "./Carousel";

const StyledLink = styled(Link, {
  base: {
    color: "gray.500",
    py: 1,
    _hover: {
      textDecoration: {
        base: "none",
        md: "underline",
      },
    },
  },
});

type PostUser = Omit<NonNullable<GetUser>, "Tracks"> | null;

export const PostCard = ({
  post,
  allowComment = false,
  user,
}: {
  post: GetPostById;
  allowComment?: boolean;
  user: PostUser;
}) => {
  const {
    data: { totalPostLikes, userLiked },
  } = usePostLikes(post.id, {
    totalPostLikes: post._count.likes,
    userLiked: (post.likes?.length ?? 0) > 0,
  });
  const likePost = useLikePost(post.id);
  const {
    data: { comments, totalComments },
  } = usePostComments(post.id, {
    totalComments: post._count.comments,
    comments: post.comments,
  });

  const postAuthorName =
    post.track?.name ?? `${post.user.firstName} ${post.user.lastName}`;
  const postAuthorAvatar =
    post.track?.image ?? post.user.image ?? "/blank-driver-right.jpg";
  const postAuthorLink = post.track?.slug
    ? `/tracks/${post.track.slug}`
    : `/drivers/${post.user.driverId}`;

  return (
    <Box rounded="xl" borderWidth={1} borderColor="gray.800" bg="gray.900">
      <Box px={4} pt={3}>
        <Flex alignItems="center" gap={0.5}>
          <Box
            rounded="full"
            overflow="hidden"
            borderWidth={1}
            borderColor="gray.700"
            bg="gray.950"
            w={10}
            h={10}
            pos="relative"
            mr={1.5}
          >
            <LinkOverlay to={postAuthorLink}>
              <styled.img
                display="block"
                src={postAuthorAvatar}
                alt={postAuthorName}
                w="full"
                h="full"
                objectFit="cover"
              />
            </LinkOverlay>
          </Box>
          <Box>
            <Link
              to={postAuthorLink}
              className={css({
                fontWeight: "medium",
                lineHeight: "1.3",
              })}
            >
              {postAuthorName}
            </Link>
            <styled.p fontSize="sm" color="gray.500" lineHeight="1.3">
              <Link to={`/posts/${post.id}`}>
                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
              </Link>
            </styled.p>
          </Box>

          <Spacer />

          {user?.id === post.userId && (
            <LinkButton
              variant="ghost"
              to={`/posts/${post.id}/delete`}
              px={2}
              color="gray.400"
              aria-label="Delete post"
            >
              <RiDeleteBinFill size={14} />
            </LinkButton>
          )}

          <Button
            variant="ghost"
            size="sm"
            px={2}
            color="gray.400"
            aria-label="Share post"
            onClick={() => {
              navigator.share({
                url: `https://rcdrift.io/posts/${post.id}`,
              });
            }}
          >
            <RiShareForwardFill size={14} />
          </Button>
        </Flex>

        <Box py={3}>
          <Markdown>{post.content}</Markdown>
        </Box>
      </Box>

      {post.images.length > 0 && (
        <Flex gap={2} borderTopWidth={1} borderColor="gray.800">
          <Carousel>
            {post.images.map((image) => (
              <Center
                key={image}
                flex="none"
                maxH="800px"
                pointerEvents="none"
                w="full"
              >
                <styled.img
                  src={image}
                  alt="Post image"
                  maxW="full"
                  maxH="full"
                />
              </Center>
            ))}
          </Carousel>
        </Flex>
      )}

      {(totalPostLikes > 0 || totalComments > 0) && (
        <Flex px={4} alignItems="center" gap={1.5} py={1}>
          {totalPostLikes > 0 && (
            <>
              <Center
                w={5}
                h={5}
                rounded="full"
                bgGradient="to-b"
                gradientFrom="brand.400"
                gradientTo="brand.700"
              >
                <RiThumbUpFill size={12} />
              </Center>
              <styled.p color="gray.500" py={1}>
                {pluralize("like", totalPostLikes, true)}
              </styled.p>
            </>
          )}

          <Spacer />

          {totalComments > 0 && (
            <StyledLink to={`/posts/${post.id}`}>
              {pluralize("comment", totalComments, true)}
            </StyledLink>
          )}
        </Flex>
      )}

      {user && (
        <Flex gap={2} borderTopWidth={1} borderColor="gray.800">
          <Button
            variant="ghost"
            flex={1}
            rounded="none"
            color={userLiked ? "brand.400" : undefined}
            onClick={() => likePost.mutate(userLiked)}
            disabled={likePost.isPending}
            isLoading={likePost.isPending}
          >
            {userLiked ? (
              <RiThumbUpFill size={16} />
            ) : (
              <RiThumbUpLine size={16} />
            )}
            Like
          </Button>
          <LinkButton
            variant="ghost"
            flex={1}
            rounded="none"
            to={`/posts/${post.id}#comment`}
          >
            <RiChat3Line size={16} />
            Comment
          </LinkButton>
        </Flex>
      )}

      {(allowComment || comments.length > 0) && (
        <Flex
          flexDir="column"
          borderTopWidth={1}
          borderColor="gray.800"
          gap={1}
          pt={2}
        >
          {comments.length <= 0 && (
            <Box textAlign="center" pb={4}>
              <styled.p color="gray.500" fontSize="sm">
                This post has no comments yet.
              </styled.p>
            </Box>
          )}

          {comments.map((comment, index) => (
            <Flex
              flexDir="column"
              gap={1}
              key={comment.id}
              px={4}
              style={
                {
                  "--order": index,
                } as React.CSSProperties
              }
              order="var(--order)"
            >
              <Flex alignItems="flex-start" gap={2}>
                <Box
                  rounded="full"
                  overflow="hidden"
                  borderWidth={1}
                  borderColor="gray.700"
                  bg="gray.950"
                  w={8}
                  h={8}
                  mt={1}
                  pos="relative"
                >
                  <LinkOverlay to={`/drivers/${comment.user.driverId}`}>
                    <styled.img
                      src={comment.user.image ?? "/blank-driver-right.jpg"}
                      alt={`${comment.user.firstName} ${comment.user.lastName}`}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </LinkOverlay>
                </Box>

                <Box flex={1}>
                  <Box
                    bgColor="gray.800"
                    rounded="xl"
                    px={3}
                    py={2}
                    w="fit-content"
                  >
                    <Link to={`/drivers/${comment.user.driverId}`}>
                      <styled.p fontSize="sm" fontWeight="medium">
                        {comment.user.firstName} {comment.user.lastName}
                      </styled.p>
                    </Link>
                    <Markdown>{comment.content}</Markdown>
                  </Box>

                  <Flex gap={4} alignItems="center" pl={3}>
                    <styled.p color="gray.500" fontSize="sm" py={1}>
                      {formatDistanceToNow(comment.createdAt, {
                        addSuffix: true,
                      })}
                    </styled.p>

                    {user && (
                      <StyledLink
                        to={`/posts/${post.id}?reply=${comment.id}&comment=@${comment.user.driverId}(${comment.user.firstName} ${comment.user.lastName})#comment`}
                        fontSize="sm"
                      >
                        Reply
                      </StyledLink>
                    )}
                    {user?.id === comment.user.id && (
                      <StyledLink
                        to={`/comments/${comment.id}/delete`}
                        fontSize="sm"
                      >
                        Delete
                      </StyledLink>
                    )}
                  </Flex>
                </Box>
              </Flex>

              {(comment.replies?.length ?? 0) > 0 && (
                <Flex flexDir="column" gap={1} pl={4}>
                  {comment.replies?.map((reply) => (
                    <Flex key={reply.id} alignItems="flex-start" gap={2}>
                      <Box
                        w={6}
                        h={6}
                        flex="none"
                        borderBottomLeftRadius="xl"
                        borderLeftWidth={2}
                        borderColor="gray.800"
                        borderBottomWidth={2}
                      />
                      <Box
                        rounded="full"
                        overflow="hidden"
                        borderWidth={1}
                        borderColor="gray.700"
                        bg="gray.950"
                        w={8}
                        h={8}
                        mt={1}
                        pos="relative"
                      >
                        <LinkOverlay to={`/drivers/${reply.user.driverId}`}>
                          <styled.img
                            src={reply.user.image ?? "/blank-driver-right.jpg"}
                            alt={`${reply.user.firstName} ${reply.user.lastName}`}
                            w="full"
                            h="full"
                            objectFit="cover"
                          />
                        </LinkOverlay>
                      </Box>
                      <Box flex={1}>
                        <Box
                          bgColor="gray.800"
                          rounded="xl"
                          px={3}
                          py={2}
                          w="fit-content"
                        >
                          <Link to={`/drivers/${reply.user.driverId}`}>
                            <styled.p fontSize="sm" fontWeight="medium">
                              {reply.user.firstName} {reply.user.lastName}
                            </styled.p>
                          </Link>
                          <Markdown>{reply.content}</Markdown>
                        </Box>

                        <Flex gap={4} alignItems="center" pl={3}>
                          <styled.p
                            color="gray.500"
                            fontSize="sm"
                            py={1}
                            pl={3}
                          >
                            {formatDistanceToNow(reply.createdAt, {
                              addSuffix: true,
                            })}
                          </styled.p>

                          {user && (
                            <StyledLink
                              to={`/posts/${post.id}?reply=${comment.id}&comment=@${reply.user.driverId}(${reply.user.firstName} ${reply.user.lastName})#comment`}
                              fontSize="sm"
                            >
                              Reply
                            </StyledLink>
                          )}

                          {user?.id === reply.user.id && (
                            <StyledLink
                              to={`/comments/${reply.id}/delete`}
                              fontSize="sm"
                            >
                              Delete
                            </StyledLink>
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  ))}
                </Flex>
              )}
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  );
};
