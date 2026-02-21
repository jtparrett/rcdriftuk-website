import type { LoaderFunctionArgs } from "react-router";
import { prisma } from "~/utils/prisma.server";
import { getAuth } from "~/utils/getAuth.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const auth = await getAuth(args);

  if (!auth.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(args.request.url);
  const query = url.searchParams.get("q")?.toLowerCase() || "";

  if (!query) {
    return [];
  }

  const parts = query.split(/\s+/).filter(Boolean);

  const users = await prisma.users.findMany({
    where: {
      AND: [
        {
          driverId: {
            not: 0,
          },
        },
        ...parts.map((part) => ({
          OR: [
            {
              firstName: {
                contains: part,
                mode: "insensitive" as const,
              },
            },
            {
              lastName: {
                contains: part,
                mode: "insensitive" as const,
              },
            },
          ],
        })),
      ],
    },
    select: {
      id: true,
      driverId: true,
      firstName: true,
      lastName: true,
      image: true,
    },
    take: 15,
    orderBy: [
      {
        firstName: "asc",
      },
      {
        lastName: "asc",
      },
    ],
  });

  return users;
};
