import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { ChampHeader } from "~/components/ChampHeader";
import { styled, Box } from "~/styled-system/jsx";
import { NEXT_EVENT } from "~/utils/consts/nextEvent";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.pathname === "/2024" || url.pathname === "/2024/") {
    return redirect(`/2024/schedule/${NEXT_EVENT}`);
  }

  return null;
};

const Page = () => {
  return (
    <>
      <ChampHeader />
      <Outlet />
      <Box
        borderTopWidth={1}
        borderColor="gray.700"
        py={8}
        textAlign="center"
        mt={4}
      >
        <styled.p>&copy; RC Drift UK 2024</styled.p>
      </Box>
    </>
  );
};

export default Page;
