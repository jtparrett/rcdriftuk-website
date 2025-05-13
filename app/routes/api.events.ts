import type { LoaderFunctionArgs } from "react-router";
import { prisma } from "~/utils/prisma.server";
import z from "zod";

export const loader = async (args: LoaderFunctionArgs) => {
  const url = new URL(args.request.url);
  const page = z.coerce.number().parse(url.searchParams.get("page"));

  const requestHeaders = new Headers(args.request.headers);
  const auth = requestHeaders.get("Authorization");

  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = z.string().parse(auth);

  if (token !== process.env.UNIVERSAL_API_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  const events = await prisma.events.findMany({
    skip: page * 50,
    take: 50,
    orderBy: {
      startDate: "desc",
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      eventTrack: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return events.map((event) => {
    return {
      ...event,
      url: `https://rcdrift.uk/events/${event.id}`,
    };
  });
};
