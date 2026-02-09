import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export const usePostLikes = (
  id: number,
  initialData: {
    totalPostLikes: number;
    userLiked: boolean;
  },
) => {
  return useQuery({
    queryKey: ["post", id, "likes"],
    queryFn: () => {
      return {
        totalPostLikes: initialData.totalPostLikes,
        userLiked: initialData.userLiked,
      };
    },
    initialData,
    staleTime: Infinity,
  });
};

export const useLikePost = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn(postWasLiked: boolean) {
      queryClient.setQueryData(["post", id, "likes"], postWasLiked ? 0 : 1);

      const response = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to like post");
      }

      const data = await response.json();

      return z
        .object({
          totalPostLikes: z.number(),
          userLiked: z.boolean(),
        })
        .parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["post", id, "likes"], data);
    },
  });
};
