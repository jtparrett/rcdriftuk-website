import type { LoaderFunctionArgs } from "react-router";
import { getAuth } from "~/utils/getAuth.server";
import { getFeedPosts } from "~/utils/getFeedPosts.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { userId } = await getAuth(args);
  const { request } = args;
  const url = new URL(request.url);

  const cursor = url.searchParams.get("cursor");

  const result = await getFeedPosts({
    cursor: cursor ? parseInt(cursor) : undefined,
    userId: userId || undefined,
  });

  return Response.json({
    posts: result.posts,
  });
};
