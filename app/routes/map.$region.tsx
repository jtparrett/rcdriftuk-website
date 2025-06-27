import { TrackStatus } from "~/utils/enums";
import { useLoaderData } from "react-router";
import { ClientOnly } from "~/components/ClientOnly";
import { Map } from "~/components/Map.client";

import { Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/map.$region";
import { startOfDay } from "date-fns";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "RC Drift UK | Map" },
    { name: "description", content: "Welcome to RCDrift.uk" },
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
        base: "calc(100dvh - 145px)",
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
