import { useFormik } from "formik";
import { Link, useSearchParams } from "react-router";
import { Box, Flex, Spacer, styled } from "~/styled-system/jsx";
import { css } from "~/styled-system/css";
import type { GetUser } from "~/utils/getUser.server";
import { useCreateComment, usePostComments } from "~/utils/usePostComments";
import { RiCloseLine, RiSendPlaneFill } from "react-icons/ri";
import { UserTaggingInput } from "./UserTaggingInput";
import type { GetPostById } from "~/utils/getPostById.server";
import { useEffect } from "react";
import { toFormikValidationSchema } from "zod-formik-adapter";
import z from "zod";
import { Button } from "./Button";

const commentSchema = z.object({
  comment: z.string().min(1),
});

const validationSchema = toFormikValidationSchema(commentSchema);

export const PostCommentForm = ({
  post,
  user,
}: {
  post: GetPostById;
  user: Omit<NonNullable<GetUser>, "Tracks"> | null;
}) => {
  const [searchParams] = useSearchParams();
  const initialComment = searchParams.get("comment");
  const replyId = searchParams.get("reply");
  const createComment = useCreateComment(post.id, user);
  const {
    data: { comments },
  } = usePostComments(post.id, {
    totalComments: post._count.comments,
    comments: post.comments,
  });
  const replyComment = replyId
    ? comments.find((comment) => comment.id === Number(replyId))
    : null;

  const formik = useFormik({
    validationSchema,
    initialValues: {
      comment: initialComment ?? "",
    },
    onSubmit(values) {
      formik.resetForm();
      createComment.mutate({
        comment: values.comment,
        replyId,
      });
    },
  });

  useEffect(() => {
    formik.setFieldValue("comment", initialComment ?? "");
  }, [searchParams]);

  return (
    <form onSubmit={formik.handleSubmit} id="comment">
      <Flex gap={2} alignItems="flex-end">
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
          borderWidth={1}
          borderColor="gray.700"
        >
          {replyComment && (
            <Flex
              pl={4}
              pr={1}
              py={0.5}
              bgColor="gray.900"
              borderTopRadius="xl"
              alignItems="center"
            >
              <styled.p color="gray.500" fontSize="sm">
                Replying to {replyComment.user.firstName}{" "}
                {replyComment.user.lastName}
              </styled.p>
              <Spacer />
              <Link
                to={`/posts/${post.id}#comment`}
                className={css({
                  p: 1,
                })}
              >
                <RiCloseLine />
              </Link>
            </Flex>
          )}
          <UserTaggingInput
            placeholder="Add a comment..."
            name="comment"
            value={formik.values.comment}
            onChange={(value) => formik.setFieldValue("comment", value)}
            rounded="xl"
            placement="top"
          />
        </Box>

        {formik.isValid && (
          <Button
            px={0}
            py={0}
            w={8}
            h={8}
            mb={1.5}
            type="submit"
            disabled={createComment.isPending}
            isLoading={createComment.isPending}
          >
            <RiSendPlaneFill size={16} />
          </Button>
        )}
      </Flex>
    </form>
  );
};
