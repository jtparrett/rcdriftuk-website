import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Suspense } from "react";
import { Map } from "~/components/Map.client";
import { Box } from "~/styled-system/jsx";
import { getTabParam } from "~/utils/getTabParam";

export const meta: MetaFunction = () => {
  return [
    { title: "RC Drift UK | Map" },
    { name: "description", content: "Welcome to RCDrift.uk" },
  ];
};

export const loader = ({ params }: LoaderFunctionArgs) => {
  const tab = getTabParam(params.tab);

  return { tab };
};

const Page = () => {
  return (
    <Box position="absolute" inset={0} zIndex={1}>
      <Suspense fallback={<p>loading..</p>}>
        <Map />
      </Suspense>
    </Box>
  );
};

export default Page;
