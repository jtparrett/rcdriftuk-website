import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.server";

const PAGE_SIZE = 4;

interface GetFeedPostsOptions {
  cursorScore?: number;
  cursorId?: number;
  userId?: string;
  timestamp?: Date;
}

// Simple hash function for deterministic randomness
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export async function getFeedPosts(options: GetFeedPostsOptions = {}) {
  const { cursorScore, cursorId, userId, timestamp } = options;

  // Use consistent timestamp for pagination or current time for initial load
  const scoreTimestamp = timestamp || new Date();

  // Get current day for randomness seed (convert to integer for PostgreSQL)
  const currentDay = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const userSeed = userId || "anonymous";

  // Create a deterministic seed from user and day
  const seedString = userSeed + currentDay;
  const seed = simpleHash(seedString) % 1000000; // Keep it reasonable for PostgreSQL

  const postIds = await prisma.$queryRaw<{ id: number; score: number }[]>(
    Prisma.sql`
      SELECT 
        p.id,
        ROUND(
          (
            (COALESCE(l.likes_count, 0) + COALESCE(c.comments_count, 0) * 2) / 
            POWER(GREATEST(EXTRACT(EPOCH FROM ${scoreTimestamp}::timestamp - p."createdAt") / 3600, 1), 1.8)
          ) * (
            0.7 + 0.6 * (
              -- Use post id and seed to create deterministic randomness
              (((p.id * 1299827) + ${seed}) % 1000) / 1000.0
            )
          ), 4
        ) as score
      FROM "Posts" p
      LEFT JOIN (
        SELECT "postId", COUNT(*) AS likes_count
        FROM "PostLikes"
        GROUP BY "postId"
      ) l ON p.id = l."postId"
      LEFT JOIN (
        SELECT "postId", COUNT(*) AS comments_count
        FROM "PostComments"
        GROUP BY "postId"
      ) c ON p.id = c."postId"
      WHERE (
        (${cursorScore}::decimal IS NULL) OR
        (
          ROUND(
            (
              (COALESCE(l.likes_count, 0) + COALESCE(c.comments_count, 0) * 2) / 
              POWER(GREATEST(EXTRACT(EPOCH FROM ${scoreTimestamp}::timestamp - p."createdAt") / 3600, 1), 1.5)
            ) * (
              0.7 + 0.6 * (
                (((p.id * 1299827) + ${seed}) % 1000) / 1000.0
              )
            ), 4
          ) < ${cursorScore}
        ) OR (
          ROUND(
            (
              (COALESCE(l.likes_count, 0) + COALESCE(c.comments_count, 0) * 2) / 
              POWER(GREATEST(EXTRACT(EPOCH FROM ${scoreTimestamp}::timestamp - p."createdAt") / 3600, 1), 1.5)
            ) * (
              0.7 + 0.6 * (
                (((p.id * 1299827) + ${seed}) % 1000) / 1000.0
              )
            ), 4
          ) = ${cursorScore}::decimal AND p.id < ${cursorId || 0}
        )
      )
      ORDER BY 
        score DESC, 
        p.id DESC
      LIMIT ${PAGE_SIZE}
    `,
  );

  const posts = await prisma.posts.findMany({
    where: {
      id: {
        in: postIds.map((post) => post.id),
      },
    },
    include: {
      user: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      track: {
        select: {
          id: true,
          slug: true,
          name: true,
          image: true,
        },
      },
      ...(userId
        ? {
            likes: {
              where: {
                userId,
              },
            },
          }
        : {}),
      comments: {
        where: {
          parentId: null,
        },
        include: {
          user: true,
          replies: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
        take: 1,
      },
    },
  });

  // Sort posts to match the order from postIds query and attach scores
  const postIdOrder = postIds.map((post) => ({
    id: post.id,
    score: post.score,
  }));
  const sortedPosts = posts
    .sort((a, b) => {
      const indexA = postIdOrder.findIndex((p) => p.id === a.id);
      const indexB = postIdOrder.findIndex((p) => p.id === b.id);
      return indexA - indexB;
    })
    .map((post) => {
      const scoreData = postIdOrder.find((p) => p.id === post.id);
      return {
        ...post,
        _score: scoreData?.score || 0, // Add score for cursor pagination
      };
    });

  return {
    posts: sortedPosts,
    timestamp: scoreTimestamp,
  };
}
