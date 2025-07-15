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

  const users = await prisma.users.findMany({
    where: {
      AND: [
        {
          firstName: {
            not: "BYE",
          },
        },
        {
          OR: [
            {
              firstName: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
      ],
    },
    select: {
      driverId: true,
      firstName: true,
      lastName: true,
    },
    take: 10,
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
