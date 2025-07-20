import type { LoaderFunctionArgs } from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import { getFeedPosts } from "~/utils/getFeedPosts.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const { request } = args;
  const url = new URL(request.url);

  const cursorScore = url.searchParams.get("cursorScore");
  const cursorId = url.searchParams.get("cursorId");
  const timestamp = url.searchParams.get("timestamp");

  const result = await getFeedPosts({
    cursorScore: cursorScore ? parseFloat(cursorScore) : undefined,
    cursorId: cursorId ? parseInt(cursorId) : undefined,
    userId: userId || undefined,
    timestamp: timestamp ? new Date(timestamp) : undefined,
  });

  return Response.json({
    posts: result.posts,
    timestamp: result.timestamp.toISOString(),
  });
};
