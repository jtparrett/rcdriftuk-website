import { formatDistanceToNow } from "date-fns";
import { Box, Center, Flex, Spacer, styled } from "~/styled-system/jsx";
import { Button, LinkButton } from "./Button";
import {
  RiChat3Line,
  RiImage2Line,
  RiSendPlane2Line,
  RiThumbUpFill,
  RiThumbUpLine,
} from "react-icons/ri";
import type { GetPostById } from "~/utils/getPostById.server";
import { Markdown } from "./Markdown";
import { Link } from "react-router";
import pluralize from "pluralize";
import { useLikePost, usePostLikes } from "~/utils/usePostLikes";
import { Textarea } from "./Textarea";
import { SignedIn } from "@clerk/react-router";
import { useCreateComment, usePostComments } from "~/utils/usePostComments";
import type { GetUser } from "~/utils/getUser.server";
import { useFormik } from "formik";

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

export const PostCard = ({
  post,
  allowComment = false,
  user,
}: {
  post: GetPostById;
  allowComment?: boolean;
  user: Omit<NonNullable<GetUser>, "Tracks"> | null;
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
  const createComment = useCreateComment(post.id, user);

  const formik = useFormik({
    initialValues: {
      comment: "",
    },
    async onSubmit(values) {
      await createComment.mutateAsync(values.comment);
      alert("GOO");
      formik.resetForm();
    },
  });

  return (
    <Box
      rounded="xl"
      borderWidth={1}
      borderColor="gray.800"
      bg="gray.900"
      overflow="hidden"
    >
      <Box px={4} pt={3}>
        <Flex gap={2} alignItems="center">
          <Box
            rounded="full"
            overflow="hidden"
            borderWidth={1}
            borderColor="gray.700"
            bg="gray.950"
            w={10}
            h={10}
          >
            <styled.img
              display="block"
              src={post.user.image ?? "/blank-driver-right.jpg"}
              alt={`${post.user.firstName} ${post.user.lastName}`}
              w="full"
              h="full"
              objectFit="cover"
            />
          </Box>
          <Box>
            <styled.p fontWeight="medium" lineHeight="1.3">
              {post.user.firstName} {post.user.lastName}
            </styled.p>
            <styled.p fontSize="sm" color="gray.500" lineHeight="1.3">
              <Link to={`/posts/${post.id}`}>
                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
              </Link>
            </styled.p>
          </Box>
        </Flex>

        <Box pt={3}>
          <Markdown>{post.content}</Markdown>
        </Box>
      </Box>

      {post.images.length > 0 && (
        <Flex gap={2}>
          {post.images.map((image) => (
            <styled.img key={image} src={image} alt="Post image" w="full" />
          ))}
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

      <SignedIn>
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
            to={`/posts/${post.id}`}
          >
            <RiChat3Line size={16} />
            Comment
          </LinkButton>
        </Flex>
      </SignedIn>

      {comments.length > 0 && (
        <Box borderTopWidth={1} borderColor="gray.800" px={4} pt={4} pb={1}>
          {comments.map((comment) => (
            <Flex key={comment.id} alignItems="flex-start" gap={2} mb={1}>
              <Box
                rounded="full"
                overflow="hidden"
                borderWidth={1}
                borderColor="gray.700"
                bg="gray.950"
                w={8}
                h={8}
              >
                <styled.img
                  src={comment.user.image ?? "/blank-driver-right.jpg"}
                  alt={`${comment.user.firstName} ${comment.user.lastName}`}
                />
              </Box>

              <Box flex={1}>
                <Box
                  bgColor="gray.800"
                  rounded="xl"
                  px={3}
                  py={2}
                  w="fit-content"
                >
                  <styled.p color="gray.300" fontSize="sm">
                    {comment.content}
                  </styled.p>
                </Box>

                <Flex gap={4} alignItems="center" pl={3}>
                  <styled.p color="gray.500" fontSize="sm" py={1}>
                    {formatDistanceToNow(comment.createdAt, {
                      addSuffix: true,
                    })}
                  </styled.p>
                  <StyledLink to={`/posts/${post.id}`} fontSize="sm">
                    Like
                  </StyledLink>
                  <StyledLink to={`/posts/${post.id}`} fontSize="sm">
                    Reply
                  </StyledLink>
                </Flex>
              </Box>
            </Flex>
          ))}
        </Box>
      )}

      {allowComment && (
        <SignedIn>
          <form onSubmit={formik.handleSubmit}>
            <Flex borderTopWidth={1} borderColor="gray.800" p={4} gap={2}>
              <Box
                w={10}
                h={10}
                rounded="full"
                overflow="hidden"
                borderWidth={1}
                borderColor="gray.700"
              >
                <styled.img
                  w="full"
                  h="full"
                  src={user?.image ?? "/blank-driver-right.jpg"}
                  objectFit="cover"
                />
              </Box>
              <Box
                flex={1}
                bgColor="gray.800"
                rounded="xl"
                overflow="hidden"
                borderWidth={1}
                borderColor="gray.700"
              >
                <Textarea
                  pb="38px"
                  placeholder="Add a comment..."
                  autoFocus
                  name="comment"
                  value={formik.values.comment}
                  onChange={formik.handleChange}
                />
                <Flex borderTopWidth={1} borderColor="gray.700" p={2}>
                  <Spacer />
                  <Button
                    px={0}
                    py={0}
                    w={8}
                    h={8}
                    type="submit"
                    disabled={createComment.isPending}
                    isLoading={createComment.isPending}
                  >
                    <RiSendPlane2Line size={16} />
                  </Button>
                </Flex>
              </Box>
            </Flex>
          </form>
        </SignedIn>
      )}
    </Box>
  );
};
