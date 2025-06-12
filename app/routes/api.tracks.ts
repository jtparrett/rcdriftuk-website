import type { LoaderFunctionArgs } from "react-router";
import { prisma } from "~/utils/prisma.server";
import z from "zod";
import { TrackStatus } from "~/utils/enums";

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

  const tracks = await prisma.tracks.findMany({
    skip: page * 25,
    take: 25,
    where: {
      status: TrackStatus.ACTIVE,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      image: true,
      address: true,
      lat: true,
      lng: true,
      slug: true,
      description: true,
    },
  });

  return tracks.map((track) => {
    return {
      ...track,
      url: `https://rcdrift.uk/tracks/${track.slug}`,
    };
  });
};
