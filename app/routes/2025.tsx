import { Box, Container, Flex, styled } from "~/styled-system/jsx";
import { Outlet, useLocation } from "@remix-run/react";
import { Tab } from "~/components/Tab";

const Page = () => {
  const location = useLocation();

  return (
    <styled.main>
      <Box borderBottomWidth={1} borderColor="gray.800">
        <Container px={2} maxW={1100}>
          <Flex gap={2} py={2} alignItems="center">
            <Tab
              to="/2025"
              isActive={location.pathname.replaceAll(/\//g, "") === "2025"}
            >
              Overview
            </Tab>
            <Tab
              to="/2025/schedule"
              isActive={location.pathname.startsWith("/2025/schedule")}
            >
              Schedule
            </Tab>
          </Flex>
        </Container>
      </Box>

      <Outlet />
    </styled.main>
  );
};

export default Page;
