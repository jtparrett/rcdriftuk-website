import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { GetUser } from "./getUser.server";

const userSchema = z.object({
  driverId: z.number().nullable(),
  id: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  image: z.string().nullable(),
});

export const commentSchema = z.object({
  id: z.number(),
  content: z.string(),
  createdAt: z.coerce.date(),
  user: userSchema,
  replies: z
    .array(
      z.object({
        id: z.number(),
        content: z.string(),
        createdAt: z.coerce.date(),
        user: userSchema,
      }),
    )
    .optional()
    .nullable(),
});

export type Comment = z.infer<typeof commentSchema>;

export const usePostComments = (
  postId: number,
  initialData: {
    totalComments: number;
    comments: Comment[];
  },
) => {
  return useQuery({
    queryKey: ["post", postId, "comments"],
    queryFn: () => {
      return initialData;
    },
    initialData,
  });
};

type User = Omit<NonNullable<GetUser>, "Tracks"> | null;

export const useCreateComment = (postId: number, user: User) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { comment: string; replyId: string | null }) => {
      const { comment, replyId } = data;

      if (!user) {
        throw new Error("User not found");
      }

      const existingComments = queryClient.getQueryData<{
        totalComments: number;
        comments: Comment[];
      }>(["post", postId, "comments"]);

      const newComment: Comment = {
        content: comment,
        createdAt: new Date(),
        id: new Date().getTime(),
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          driverId: user.driverId,
        },
      };

      if (!replyId) {
        const newComments = [...(existingComments?.comments ?? []), newComment];
        const totalComments = (existingComments?.totalComments ?? 0) + 1;
        queryClient.setQueryData(["post", postId, "comments"], {
          totalComments,
          comments: newComments,
        });
      } else {
        const replyComment = existingComments?.comments.find(
          (comment) => comment.id === Number(replyId),
        )?.replies;
        if (replyComment) {
          const newReplies = [...(replyComment ?? []), newComment];

          queryClient.setQueryData(["post", postId, "comments"], {
            totalComments: existingComments?.totalComments ?? 0,
            comments: existingComments?.comments.map((comment) =>
              comment.id === Number(replyId)
                ? {
                    ...comment,
                    replies: newReplies,
                  }
                : comment,
            ),
          });
        }
      }

      await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        body: JSON.stringify({ comment, replyId }),
      });
    },
  });
};
