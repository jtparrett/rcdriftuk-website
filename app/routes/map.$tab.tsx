import { TrackStatus } from "~/utils/enums";
import { useLoaderData } from "react-router";
import { ClientOnly } from "~/components/ClientOnly";
import { Map } from "~/components/Map.client";

import { Flex } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";
import type { Route } from "./+types/map.$tab";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "RC Drift UK | Map" },
    { name: "description", content: "Welcome to RCDrift.uk" },
  ];
};

export const loader = async () => {
  const tracks = await prisma.tracks.findMany({
    where: {
      status: TrackStatus.ACTIVE,
    },
  });

  return tracks;
};

const Page = () => {
  const tracks = useLoaderData<typeof loader>();

  return (
    <Flex h="calc(100dvh - 100px)" flexDir="column">
      <ClientOnly>
        <Map tracks={tracks} />
      </ClientOnly>
    </Flex>
  );
};

export default Page;
