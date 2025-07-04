import { formatDistanceToNow } from "date-fns";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { Button } from "./Button";
import { RiChat3Line, RiThumbUpLine } from "react-icons/ri";
import type { GetPostById } from "~/utils/getPostById.server";
import { Markdown } from "./Markdown";

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
            <styled.p fontWeight="medium">
              {post.user.firstName} {post.user.lastName}
            </styled.p>
            <styled.p fontSize="sm" color="gray.500">
              {formatDistanceToNow(post.createdAt, { addSuffix: true })}
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

      <Flex gap={2} borderTopWidth={1} borderColor="gray.800">
        <Button variant="ghost" flex={1} rounded="none">
          <RiThumbUpLine size={16} />
          Like
        </Button>
        <Button variant="ghost" flex={1} rounded="none">
          <RiChat3Line size={16} />
          Comment
        </Button>
      </Flex>
    </Box>
  );
};
