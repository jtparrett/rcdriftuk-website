import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ClientOnly } from "~/components/ClientOnly";
import { Map } from "~/components/Map.client";

import { Box } from "~/styled-system/jsx";
import { prisma } from "~/utils/prisma.server";

export const meta: MetaFunction = () => {
  return [
    { title: "RC Drift UK | Map" },
    { name: "description", content: "Welcome to RCDrift.uk" },
  ];
};

export const loader = async () => {
  const tracks = await prisma.tracks.findMany();

  return tracks;
};

const Page = () => {
  const tracks = useLoaderData<typeof loader>();

  return (
    <Box position="absolute" inset={0} zIndex={1}>
      <ClientOnly>
        <Map tracks={tracks} />
      </ClientOnly>
    </Box>
  );
};

export default Page;
