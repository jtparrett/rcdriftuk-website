import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Suspense } from "react";
import { Map } from "~/components/Map.client";
import { Box } from "~/styled-system/jsx";
import { getTabParam } from "~/utils/getTabParam";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = ({ params }: LoaderFunctionArgs) => {
  const tab = getTabParam(params.tab);

  return { tab };
};

export default function Index() {
  return (
    <Box position="absolute" inset={0} zIndex={1}>
      <Suspense fallback={<p>loading..</p>}>
        <Map />
      </Suspense>
    </Box>
  );
}
