import { formatDistanceToNow } from "date-fns";
import { Box, Flex, Spacer, styled } from "~/styled-system/jsx";
import { Button, LinkButton } from "./Button";
import { RiChat3Line, RiThumbUpLine } from "react-icons/ri";
import type { GetPostById } from "~/utils/getPostById.server";
import { Markdown } from "./Markdown";
import { Link } from "react-router";
import pluralize from "pluralize";

const StyledLink = styled(Link, {
  base: {
    color: "gray.500",
    py: 1,
  },
});

export const PostCard = ({ post }: { post: GetPostById }) => {
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

      {(post._count.likes > 0 || post._count.comments > 0) && (
        <Flex px={4}>
          {post._count.likes > 0 && (
            <styled.p color="gray.500" py={1}>
              {pluralize("like", post._count.likes, true)}
            </styled.p>
          )}

          <Spacer />

          {post._count.comments > 0 && (
            <StyledLink to={`/posts/${post.id}`}>
              {pluralize("comment", post._count.comments, true)}
            </StyledLink>
          )}
        </Flex>
      )}

      <Flex gap={2} borderTopWidth={1} borderColor="gray.800">
        <Button variant="ghost" flex={1} rounded="none">
          <RiThumbUpLine size={16} />
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

      {post.comments.length > 0 && (
        <Box borderTopWidth={1} borderColor="gray.800" px={4} pt={4} pb={1}>
          {post.comments.map((comment) => (
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
    </Box>
  );
};
