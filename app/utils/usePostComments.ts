import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { GetUser } from "./getUser.server";

export const commentSchema = z.object({
  id: z.number(),
  content: z.string(),
  createdAt: z.coerce.date(),
  user: z.object({
    id: z.string().nullable(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    image: z.string().nullable(),
  }),
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
    mutationFn: async (comment: string) => {
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
        },
      };

      queryClient.setQueryData(["post", postId, "comments"], {
        totalComments: (existingComments?.totalComments ?? 0) + 1,
        comments: [...(existingComments?.comments ?? []), newComment],
      });

      const response = await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      });

      const data = await response.json();

      return z
        .object({
          totalComments: z.number(),
          comments: z.array(commentSchema),
        })
        .parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["post", postId, "comments"], data);
    },
  });
};
