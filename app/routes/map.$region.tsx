import { TrackStatus } from "~/utils/enums";
import { useLoaderData } from "react-router";
import { ClientOnly } from "~/components/ClientOnly";
import { Map } from "~/components/Map.client";

import { Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/map.$region";
import { startOfDay } from "date-fns";
import { AppName } from "~/utils/enums";

export const meta: Route.MetaFunction = () => {
  return [
    { title: `${AppName} | Map` },
    { name: "description", content: "Find your local RC Drift track" },
    {
      property: "og:image",
      content: "https://rcdrift.io/og-image.jpg",
    },
  ];
};

export const loader = async () => {
  const tracks = await prisma.tracks.findMany({
    include: {
      events: {
        where: {
          startDate: {
            gte: startOfDay(new Date()),
          },
        },
        orderBy: {
          startDate: "asc",
        },
        take: 1,
      },
    },
  });

  return tracks
    .sort((a, b) => {
      if (a.slug === "rcduk") return 1;
      if (b.slug === "rcduk") return -1;
      if (a.slug === "drift-essex") return 1;
      if (b.slug === "drift-essex") return -1;
      return a.name.localeCompare(b.name);
    })
    .map((track) => {
      return {
        ...track,
        hasUpcomingEvent: track.events.length > 0,
      };
    });
};

const Page = () => {
  const tracks = useLoaderData<typeof loader>();

  return (
    <Flex
      h={{
        base: "calc(100dvh - env(safe-area-inset-bottom) - env(safe-area-inset-top) - 128px)",
        md: "calc(100dvh - 100px)",
      }}
      overflow="hidden"
      flexDir="column"
    >
      <ClientOnly>
        <Map tracks={tracks} />
      </ClientOnly>
    </Flex>
  );
};

export default Page;
