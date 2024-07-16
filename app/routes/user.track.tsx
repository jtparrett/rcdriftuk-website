import { getAuth } from "@clerk/remix/ssr.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const user = await getAuth(args);

  if (!user.userId) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const userData = await prisma.users.findFirst({
    where: {
      id: user.userId,
    },
    include: {
      track: true,
    },
  });

  if (userData?.trackId) {
    throw redirect(`/tracks/${userData.track?.slug}`);
  }

  return null;
};
