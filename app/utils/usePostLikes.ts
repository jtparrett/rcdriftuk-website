import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

type PostLikesData = {
  totalPostLikes: number;
  userLiked: boolean;
};

export const usePostLikes = (id: number, serverData: PostLikesData) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setQueryData<PostLikesData>(["post", id, "likes"], serverData);
  }, [id, serverData.totalPostLikes, serverData.userLiked, queryClient]);

  return useQuery({
    queryKey: ["post", id, "likes"],
    queryFn: () => serverData,
    initialData: serverData,
    staleTime: Infinity,
  });
};

export const useLikePost = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn(postWasLiked: boolean) {
      queryClient.setQueryData<PostLikesData>(
        ["post", id, "likes"],
        (old) => ({
          totalPostLikes: (old?.totalPostLikes ?? 0) + (postWasLiked ? -1 : 1),
          userLiked: !postWasLiked,
        }),
      );

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
