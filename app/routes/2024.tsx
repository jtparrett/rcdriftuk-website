import { LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { BsFacebook, BsInstagram } from "react-icons/bs/index.js";
import { ChampHeader } from "~/components/ChampHeader";
import { styled, Box, Flex } from "~/styled-system/jsx";

export const meta: MetaFunction = () => {
  return [
    { title: "RC Drift UK | Championship" },
    {
      name: "description",
      content: "Welcome to the RCDrift.uk 2024 championship",
    },
    {
      property: "og:image",
      content: "https://rcdrift.uk/2024-cover.jpg",
    },
  ];
};

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.pathname === "/2024" || url.pathname === "/2024/") {
    return redirect(`/2024/schedule`);
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
        borderColor="gray.800"
        py={8}
        textAlign="center"
        mt={4}
      >
        <Flex justifyContent="center" gap={4} pb={4}>
          <styled.a
            fontSize="2xl"
            target="_blank"
            href="https://www.facebook.com/RCDRIFTUK2024/"
          >
            <BsFacebook />
          </styled.a>

          <styled.a
            target="_blank"
            fontSize="2xl"
            href="https://www.instagram.com/rcdriftuk"
          >
            <BsInstagram />
          </styled.a>
        </Flex>
        <styled.p>&copy; RCDrift UK 2024</styled.p>
      </Box>
    </>
  );
};

export default Page;
