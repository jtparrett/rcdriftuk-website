import { LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node";
import { Outlet, useLocation } from "@remix-run/react";
import { RiFacebookFill, RiInstagramFill } from "react-icons/ri/index.js";
import { LinkButton } from "~/components/Button";
import { Header } from "~/components/Header";
import { Tab } from "~/components/Tab";
import { styled, Box, Flex, Spacer, Container } from "~/styled-system/jsx";

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
  const location = useLocation();

  return (
    <>
      <Container px={2} maxW={1100}>
        <Header />

        <Flex p={1} bgColor="gray.800" rounded="lg" gap={2} mb={2}>
          <Tab
            to="/2024/schedule"
            isActive={
              location.pathname === "/2024/schedule" ||
              location.pathname === "/2024/schedule/"
            }
          >
            Schedule
          </Tab>
          <Tab
            to="/2024/standings"
            isActive={location.pathname.startsWith("/2024/standings")}
          >
            Standings
          </Tab>

          <Spacer />

          <LinkButton to="/2024/live" size="sm">
            Watch Live
          </LinkButton>
        </Flex>
      </Container>

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
            <RiFacebookFill />
          </styled.a>

          <styled.a
            target="_blank"
            fontSize="2xl"
            href="https://www.instagram.com/rcdriftuk"
          >
            <RiInstagramFill />
          </styled.a>
        </Flex>
        <styled.p>&copy; RCDrift UK 2024</styled.p>
      </Box>
    </>
  );
};

export default Page;
